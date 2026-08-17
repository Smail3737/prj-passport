terraform {
  required_version = ">= 1.5.0"
}

resource "aws_security_group" "demo" {
  name = "demo-security-group"

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["203.0.113.10/32"]
  }
}
