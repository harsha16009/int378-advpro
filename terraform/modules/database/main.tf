resource "aws_docdb_subnet_group" "main" {
  name       = "fruithub-docdb-subnet-group-${var.environment}"
  subnet_ids = var.private_subnet_ids

  tags = {
    Name = "fruithub-docdb-subnet-group-${var.environment}"
  }
}

resource "aws_docdb_cluster" "mongodb_compatible" {
  cluster_identifier      = "fruithub-docdb-${var.environment}"
  engine                  = "docdb"
  master_username         = "admin"
  master_password         = "ChangeMeInProduction123!"
  backup_retention_period = 5
  preferred_backup_window = "07:00-09:00"
  skip_final_snapshot     = true
  db_subnet_group_name    = aws_docdb_subnet_group.main.name
  vpc_security_group_ids  = [var.db_security_group_id]

  tags = {
    Name = "fruithub-docdb-${var.environment}"
  }
}

resource "aws_docdb_cluster_instance" "cluster_instances" {
  count              = var.environment == "prod" ? 2 : 1
  identifier         = "fruithub-docdb-${var.environment}-${count.index}"
  cluster_identifier = aws_docdb_cluster.mongodb_compatible.id
  instance_class     = var.db_instance_class
}
