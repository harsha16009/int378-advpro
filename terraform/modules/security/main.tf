resource "aws_security_group" "alb" {
  name        = "fruithub-alb-sg-${var.environment}"
  description = "Controls traffic to ALB"
  vpc_id      = var.vpc_id

  ingress {
    description = "HTTP ingress"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS ingress"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "fruithub-alb-sg-${var.environment}"
  }
}

resource "aws_security_group" "ecs" {
  name        = "fruithub-ecs-sg-${var.environment}"
  description = "Controls traffic to microservice containers"
  vpc_id      = var.vpc_id

  ingress {
    description     = "Traffic from ALB"
    from_port       = 0
    to_port         = 65535
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "fruithub-ecs-sg-${var.environment}"
  }
}

resource "aws_security_group" "db" {
  name        = "fruithub-db-sg-${var.environment}"
  description = "Controls traffic to MongoDB / DocumentDB"
  vpc_id      = var.vpc_id

  ingress {
    description     = "MongoDB traffic from ECS containers"
    from_port       = 27017
    to_port         = 27017
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "fruithub-db-sg-${var.environment}"
  }
}
