output "vpc_id" {
  description = "The ID of the VPC"
  value       = module.vpc.vpc_id
}

output "public_subnets" {
  description = "List of public subnet IDs"
  value       = module.vpc.public_subnet_ids
}

output "private_subnets" {
  description = "List of private subnet IDs"
  value       = module.vpc.private_subnet_ids
}

output "alb_dns_name" {
  description = "Public Load Balancer DNS endpoint"
  value       = module.compute.alb_dns_name
}

output "ecs_cluster_name" {
  description = "Name of the ECS Cluster"
  value       = module.compute.cluster_name
}

output "database_endpoint" {
  description = "MongoDB-compatible DocumentDB cluster endpoint"
  value       = module.database.endpoint
}
