---
plan name: vpn-infrastructure
plan description: Deploy frontend on VPS with pivpn backend connection
plan status: active
---

## Idea
Set up VPS service with pivpn to connect frontend to backend through VPN tunnel

## Implementation
- Set up VPS hosting service with required specifications
- Install and configure pivpn on backend server
- Create VPN client configuration for frontend VPS
- Update Docker Compose to work with VPN connection
- Modify frontend API client to use VPN endpoint
- Update environment variables for VPN connection
- Add VPN connection documentation
- Test VPN connectivity and end-to-end functionality
- Configure firewall rules for VPN traffic
- Add health checks and monitoring for VPN connection

## Required Specs
<!-- SPECS_START -->
<!-- SPECS_END -->