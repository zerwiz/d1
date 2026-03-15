use tantivy::schema::{Schema, TEXT, STORED};
use tantivy::{doc, Index};
use walkdir::WalkDir;
use std::fs;
use std::path::PathBuf;
use std::env;

const CHUNK_SIZE: usize = 1000;
const CHUNK_OVERLAP: usize = 200;

fn main() -> tantivy::Result<()> {
    let mut schema_builder = Schema::builder();
    let title = schema_builder.add_text_field("title", TEXT | STORED);
    let path = schema_builder.add_text_field("path", STORED);
    let content = schema_builder.add_text_field("content", TEXT | STORED);
    let schema = schema_builder.build();

    let index_dir = env::var("RAG_INDEX_DIR").unwrap_or_else(|_| "../../systems/rag/tantivy_index".to_string());
    let index_path = PathBuf::from(&index_dir);
    fs::create_dir_all(&index_path)?;

    let index = Index::create_in_dir(&index_path, schema.clone())?;
    let mut index_writer = index.writer(100_000_000)?;

    let scan_dirs_str = env::var("RAG_SCAN_DIRS").unwrap_or_else(|_| env::var("RAG_DATA_DIR").unwrap_or_else(|_| "../../data".to_string()));
    let scan_dirs: Vec<String> = scan_dirs_str
        .split(',')
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .collect();

    let exclude_dirs_raw = env::var("RAG_EXCLUDE_DIRS").unwrap_or_default();
    let exclude_dirs: Vec<String> = exclude_dirs_raw
        .split(',')
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .collect();

    let dirs_to_scan = if scan_dirs.is_empty() {
        vec![env::var("RAG_DATA_DIR").unwrap_or_else(|_| "../../data".to_string())]
    } else {
        scan_dirs
    };

    for dir in &dirs_to_scan {
        eprintln!("Scanning directory: {}", dir);
        for entry in WalkDir::new(dir).into_iter().filter_map(|e| e.ok()) {
            let file_path = entry.path().to_string_lossy().to_string();
            if exclude_dirs.iter().any(|ex| file_path.starts_with(ex)) {
                continue;
            }
            if entry.path().extension().map_or(false, |ext| ext == "md") {
                if let Ok(text) = fs::read_to_string(entry.path()) {
                    let file_name = entry.file_name().to_string_lossy().to_string();
                    let mut start = 0;
                    while start < text.len() {
                        let end = std::cmp::min(start + CHUNK_SIZE, text.len());
                        let chunk = text[start..end].to_string();
                        index_writer.add_document(doc!(
                            title => file_name.clone(),
                            path => file_path.clone(),
                            content => chunk
                        ))?;
                        if end >= text.len() {
                            break;
                        }
                        start += CHUNK_SIZE.saturating_sub(CHUNK_OVERLAP);
                    }
                }
            }
        }
    }

    index_writer.commit()?;
    Ok(())
}
