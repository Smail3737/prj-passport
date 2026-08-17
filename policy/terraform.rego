package main

deny contains msg if {
  some name
  some rule in input.resource.aws_security_group[name].ingress

  rule.from_port == 22
  rule.to_port == 22
  rule.cidr_blocks[_] == "0.0.0.0/0"

  msg := sprintf(
    "Security Group '%s' exposes SSH port 22 to the entire internet",
    [name]
  )
}
