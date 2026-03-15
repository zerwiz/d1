use tantivy::collector::TopDocs;
use tantivy::query::QueryParser;
use tantivy::schema::Value;
use tantivy::Index;
use std::env;
use std::path::PathBuf;

fn main() -> tantivy::Result<()> {
    let args: Vec<String> = env::args().collect();

    if args.len() < 2 {
        eprintln!("Usage: query <search_term>");
        std::process::exit(1);
    }

    let query_string = &args[1];

    let index_dir = env::var("RAG_INDEX_DIR").unwrap_or_else(|_| "../../systems/rag/tantivy_index".to_string());
    let index_path = PathBuf::from(index_dir);

    let index = Index::open_in_dir(&index_path)?;

    let schema = index.schema();
    let title = schema.get_field("title").unwrap();
    let path_field = schema.get_field("path").unwrap();
    let content_field = schema.get_field("content").unwrap();

    let reader = index.reader()?;
    let searcher = reader.searcher();

    let query_parser = QueryParser::for_index(&index, vec![title, content_field]);
    let query = query_parser.parse_query(query_string)?;

    let top_docs = searcher.search(&query, &TopDocs::with_limit(10))?;

    for (_score, doc_address) in top_docs {
        let retrieved_doc = searcher.doc::<tantivy::TantivyDocument>(doc_address)?;
        let p = retrieved_doc.get_first(path_field).and_then(|v| v.as_str()).unwrap_or("");
        let c = retrieved_doc.get_first(content_field).and_then(|v| v.as_str()).unwrap_or("");
        let line = serde_json::json!({"path": p, "content": c});
        println!("{}", line);
    }

    Ok(())
}
