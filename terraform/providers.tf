terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Remote backend configuration template (uncomment for production state locking with S3 & DynamoDB)
  # backend "s3" {
  #   bucket         = "fruithub-terraform-state"
  #   key            = "fruithub/terraform.tfstate"
  #   region         = "ap-south-1"
  #   dynamodb_table = "fruithub-tf-locks"
  #   encrypt        = true
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "FruitHub"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}
