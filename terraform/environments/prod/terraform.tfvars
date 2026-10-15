aws_region          = "ap-south-1"
environment         = "prod"
vpc_cidr            = "10.100.0.0/16"
public_subnet_cidrs = ["10.100.1.0/24", "10.100.2.0/24"]
private_subnet_cidrs = ["10.100.10.0/24", "10.100.20.0/24"]
availability_zones  = ["ap-south-1a", "ap-south-1b"]
cluster_name        = "fruithub-cluster-prod"
db_instance_class   = "db.r5.large"
