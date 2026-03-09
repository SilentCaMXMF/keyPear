# Spec: vpn-infrastructure

Scope: feature

# VPN Infrastructure Feature Specification

## Overview
Deploy frontend to Vercel while maintaining secure connection to backend through VPS reverse proxy and WireGuard VPN tunnel.

## Architecture

### Components
1. **Frontend**: Deployed on Vercel (static hosting)
2. **VPS (Reverse Proxy)**: Receives API calls from frontend
3. **Backend**: Running on home network behind WireGuard VPN
4. **WireGuard VPN**: Secure tunnel between VPS and backend

### Flow
1. Frontend calls API on Vercel domain
2. Vercel routes to VPS reverse proxy
3. VPS reverse proxy forwards through WireGuard VPN
4. Backend processes request and returns response
5. Response flows back through VPN → VPS → Vercel → Frontend

## Technical Implementation

### Frontend (Vercel)
- API calls to `https://api.yourservice.com`
- All API endpoints point to VPS reverse proxy
- No direct connection to backend IP

### VPS Configuration
```
# Install nginx as reverse proxy
# Configure WireGuard client
# Set up firewall rules
# Configure SSL certificates (Let's Encrypt)
```

### Backend Configuration
```
# WireGuard server already configured
# Accept connections from VPS WireGuard client
# Ensure services listen on VPN interface
```

## Environment Variables

### Frontend (Vercel)
```bash
VUE_APP_API_URL=https://api.yourservice.com
```

### VPS
```bash
REVERSE_PROXY_TARGET=wireguard_internal_ip:3001
```

### Backend
```bash
# Listen on VPN interface
LISTEN_INTERFACE=wg0
# Accept connections from VPS
ALLOWED_CLIENTS=vps_wireguard_ip
```

## Deployment Steps

### 1. Frontend Deployment
- Build and deploy to Vercel
- Configure environment variables
- Set up custom domain if needed

### 2. VPS Setup
- Provision VPS (DigitalOcean, Linode, etc.)
- Install nginx, WireGuard client
- Configure reverse proxy
- Set up SSL certificates

### 3. Backend Updates
- Configure WireGuard to accept VPS client
- Update firewall rules
- Test connectivity

### 4. Testing
- Verify API calls flow through VPN
- Test file uploads/downloads
- Check latency and performance

## Security Considerations

### VPN Security
- Use strong WireGuard keys
- Only allow VPS client IP on backend
- Monitor VPN connection status

### Network Security
- Firewall rules on both VPS and backend
- SSL encryption for all traffic
- Rate limiting on reverse proxy

### Data Protection
- All data travels through encrypted VPN tunnel
- No direct internet exposure of backend
- Secure storage of VPN credentials

## Monitoring

### VPS Monitoring
- VPN connection status
- Reverse proxy logs
- SSL certificate expiration

### Backend Monitoring
- VPN client connection status
- API endpoint health
- Storage usage

## Troubleshooting

### Common Issues
- VPN connection drops
- Reverse proxy misconfiguration
- SSL certificate problems
- Firewall blocking traffic

### Diagnostic Commands
```bash
# Check VPN status
wg show
# Test connectivity
ping backend_ip
# Check nginx logs
tail -f /var/log/nginx/*.log
```

## Performance Considerations

### Latency
- VPN adds minimal overhead (WireGuard is fast)
- Geographic distance between VPS and backend matters

### Bandwidth
- Suitable for typical web application traffic
- Consider if large file transfers are needed

## Cost Analysis

### Infrastructure Costs
- Vercel: Free tier or paid hosting
- VPS: ~$5-20/month depending on provider
- Domain: ~$10-15/year

### Operational Benefits
- Enhanced security
- Professional deployment
- Scalability options

## Rollback Plan

### If VPN Fails
- Temporary direct connection (development only)
- Fallback to local development mode
- Quick rollback to previous deployment

## Success Metrics

### Technical
- 100% API call success rate
- VPN connection uptime >99%
- Response times <500ms

### Business
- Secure remote access
- Professional deployment
- Scalability for growth

## Next Steps

1. Provision VPS and configure
2. Set up WireGuard client on VPS
3. Configure nginx reverse proxy
4. Deploy frontend to Vercel
5. Test end-to-end functionality
6. Monitor and optimize

## Dependencies

- Working WireGuard VPN on backend
- Backend services accessible via VPN
- Frontend ready for Vercel deployment
- SSL certificates (Let's Encrypt)

## Risk Assessment

### High Risk
- VPN connectivity issues
- Reverse proxy misconfiguration

### Medium Risk
- SSL certificate renewal
- Performance bottlenecks

### Low Risk
- DNS propagation delays
- Temporary service unavailability

## Timeline

### Phase 1: Preparation (1-2 days)
- VPS provisioning
- VPN client setup

### Phase 2: Configuration (1-2 days)
- Reverse proxy setup
- SSL certificates

### Phase 3: Deployment (1 day)
- Frontend deployment
- Testing

### Phase 4: Go Live (1 day)
- Final testing
- Monitoring setup

## Success Criteria

1. Frontend successfully deployed to Vercel
2. All API calls route through VPS → VPN → Backend
3. VPN connection remains stable
4. SSL certificates valid and working
5. Performance meets requirements
6. Security posture improved

## Maintenance

### Regular Tasks
- SSL certificate renewal
- VPN connection monitoring
- Security updates on VPS
- Performance monitoring

### Emergency Procedures
- VPN connection troubleshooting
- Reverse proxy restart procedures
- Fallback connection methods

## Documentation

### User Documentation
- How to access the service
- Troubleshooting common issues
- Security best practices

### Technical Documentation
- Architecture diagrams
- Configuration files
- Deployment procedures

## Conclusion
This architecture provides secure, professional deployment of your application while maintaining the benefits of your existing VPN infrastructure. The reverse proxy approach ensures no direct exposure of your backend while providing reliable connectivity for your frontend users.