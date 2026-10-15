output "endpoint" {
  value = aws_docdb_cluster.mongodb_compatible.endpoint
}

output "port" {
  value = aws_docdb_cluster.mongodb_compatible.port
}

output "cluster_id" {
  value = aws_docdb_cluster.mongodb_compatible.id
}
