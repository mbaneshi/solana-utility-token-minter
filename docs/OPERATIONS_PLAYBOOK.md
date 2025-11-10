# Operations Playbook

Complete operational procedures for managing Solana SPL utility tokens in production.

## Table of Contents

- [Daily Operations](#daily-operations)
- [Emergency Procedures](#emergency-procedures)
- [Monitoring](#monitoring)
- [Backup & Recovery](#backup--recovery)
- [Security Procedures](#security-procedures)
- [Incident Response](#incident-response)

## Daily Operations

### Morning Checklist

```bash
# 1. Check token supply
npm run cli info

# 2. Monitor system health
npm run monitor

# 3. Check recent transactions
solana confirm -v <recent-signature>

# 4. Verify RPC connectivity
curl -X POST https://api.mainnet-beta.solana.com \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}'
```

### Weekly Tasks

1. **Review audit logs**
   - Check all mint operations
   - Verify burn operations
   - Review authority changes

2. **Backup verification**
   - Test wallet recovery
   - Verify deployment backups
   - Check metadata backups

3. **Security audit**
   - Review access logs
   - Check for unauthorized attempts
   - Verify firewall rules

### Monthly Tasks

1. **Compliance reporting**
   - Generate supply reports
   - Document authority changes
   - Archive transaction logs

2. **Infrastructure review**
   - Update dependencies
   - Review RPC providers
   - Test failover procedures

## Emergency Procedures

### Account Compromise

**Immediate Actions (Within 5 minutes)**:

```bash
# 1. Freeze all suspicious accounts
npm run cli freeze <compromised-wallet>

# 2. Document the incident
echo "$(date): Account freeze - $(reason)" >> incident-log.txt

# 3. Notify security team
# Use webhook or manual notification
```

**Follow-up Actions (Within 1 hour)**:

1. Investigate transaction history
2. Identify affected accounts
3. Prepare recovery plan
4. Communicate with stakeholders

### Unauthorized Minting

**Detection**:
```bash
# Check recent mint transactions
solana transaction-history <mint-address> --limit 100
```

**Response**:
```bash
# 1. Revoke mint authority (PERMANENT)
npm run cli revoke mint

# 2. Document total supply
npm run cli info > supply-audit-$(date +%Y%m%d).txt

# 3. Notify stakeholders
```

### RPC Endpoint Failure

**Quick Failover**:

```bash
# Update .env file
SOLANA_RPC_URL=https://backup-rpc-endpoint.com
SOLANA_RPC_URL_SECONDARY=https://another-backup.com

# Test connectivity
npm run verify

# Resume operations
```

**RPC Providers** (in order of preference):
1. QuickNode (paid, reliable)
2. Helius (paid, fast)
3. Solana public endpoints (free, rate-limited)

### Lost Access to Admin Wallet

**Prevention**:
- Keep backup keypairs in secure locations
- Use multi-sig for production
- Document recovery procedures

**Recovery**:
1. Locate backup keypair
2. Verify ownership with test transaction
3. Update environment variables
4. Test all operations

## Monitoring

### Key Metrics

1. **Token Supply**
   ```bash
   npm run cli info
   ```
   - Alert if supply changes unexpectedly
   - Track mint/burn operations

2. **Transaction Success Rate**
   - Monitor failed transactions
   - Alert on >5% failure rate

3. **RPC Response Time**
   - Track average response time
   - Alert on >2s latency

4. **Wallet Balance**
   ```bash
   solana balance <wallet-address>
   ```
   - Ensure sufficient SOL for fees
   - Alert if balance < 0.1 SOL

### Automated Monitoring

```bash
# Run monitoring script
npm run monitor

# Set up webhook alerts (in .env)
WEBHOOK_URL=https://your-webhook.com/alerts
WEBHOOK_SECRET=your-secret-key
```

### Alert Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Supply Change | >10% | >25% |
| Failed TX | >5% | >10% |
| RPC Latency | >2s | >5s |
| Wallet Balance | <0.5 SOL | <0.1 SOL |

## Backup & Recovery

### Daily Backups

```bash
# Backup deployment info
cp deployments/mainnet-latest.json \
   backups/mainnet-$(date +%Y%m%d).json

# Backup wallet (SECURE LOCATION ONLY)
# Never commit to git
cp ~/.config/solana/id.json \
   /secure/backup/location/wallet-$(date +%Y%m%d).json
```

### Recovery Procedure

**Scenario: Lost deployment file**

```bash
# 1. Locate mint address from blockchain explorer
# 2. Create recovery deployment file
cat > deployments/mainnet-latest.json << EOF
{
  "mintAddress": "YOUR_MINT_ADDRESS",
  "decimals": 9,
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "network": "mainnet-beta"
}
EOF

# 3. Verify recovery
npm run cli info
```

**Scenario: Lost wallet**

```bash
# 1. Restore from backup
cp /secure/backup/location/wallet-backup.json \
   ~/.config/solana/id.json

# 2. Verify address
solana-keygen pubkey

# 3. Test with small transaction
npm run cli balance <your-address>
```

## Security Procedures

### Authority Management

**Mint Authority**:
- Keep until initial distribution complete
- Revoke after final mint
- NEVER transfer to unknown address

```bash
# Revoke mint authority (PERMANENT)
npm run cli revoke mint
```

**Freeze Authority**:
- Use only for compliance/security
- Document all freeze actions
- Regular audit of frozen accounts

```bash
# Freeze account
npm run cli freeze <wallet-address>

# Thaw account (after review)
npm run cli thaw <wallet-address>
```

### Access Control

**Production Access**:
- Limit to 2-3 authorized operators
- Use hardware wallets when possible
- Enable 2FA on all services
- Rotate credentials quarterly

**Audit Trail**:
```bash
# Log all operations
echo "$(date -u +%Y-%m-%d_%H:%M:%S) - $(whoami) - $OPERATION" \
     >> /var/log/token-ops.log
```

### Secret Management

**Never commit**:
- Private keys
- RPC URLs with auth tokens
- Webhook secrets
- .env files

**Secure storage**:
- Use environment variables
- Use secret managers (AWS Secrets Manager, etc.)
- Encrypt at rest
- Restrict file permissions (chmod 600)

## Incident Response

### Response Levels

**Level 1 - Low**: Minor issues, no user impact
- Response time: 24 hours
- Examples: Slow RPC, minor bugs

**Level 2 - Medium**: Service degradation
- Response time: 4 hours
- Examples: High latency, failed transactions

**Level 3 - High**: Service disruption
- Response time: 1 hour
- Examples: RPC down, CLI errors

**Level 4 - Critical**: Security incident
- Response time: 15 minutes
- Examples: Unauthorized access, compromised keys

### Incident Workflow

1. **Detection**
   - Automated alerts
   - User reports
   - Manual monitoring

2. **Classification**
   - Assess severity (Level 1-4)
   - Identify impact
   - Determine urgency

3. **Response**
   - Follow emergency procedures
   - Execute fixes
   - Monitor resolution

4. **Communication**
   - Notify stakeholders
   - Update status page
   - Document timeline

5. **Post-Mortem**
   - Root cause analysis
   - Prevention measures
   - Update procedures

### Incident Templates

**Security Incident Report**:
```
Date/Time: [UTC timestamp]
Severity: [Level 1-4]
Affected Systems: [List]
Impact: [Description]
Timeline:
- [HH:MM] Detection
- [HH:MM] Response started
- [HH:MM] Issue resolved
Root Cause: [Analysis]
Prevention: [Measures taken]
```

## Operational Checklists

### Pre-Deployment

- [ ] Test on devnet
- [ ] Verify wallet balance (>1 SOL)
- [ ] Backup current state
- [ ] Review deployment plan
- [ ] Notify team
- [ ] Test RPC connectivity
- [ ] Verify metadata files
- [ ] Check image URLs

### Post-Deployment

- [ ] Verify token creation
- [ ] Check metadata on explorer
- [ ] Test mint operation
- [ ] Document mint address
- [ ] Update README
- [ ] Backup deployment file
- [ ] Configure monitoring
- [ ] Set up alerts

### Before Authority Revocation

- [ ] Verify final supply
- [ ] Complete all planned mints
- [ ] Test burn operations
- [ ] Document decision
- [ ] Get approval (if required)
- [ ] Create backup
- [ ] Update documentation

### Maintenance Window

- [ ] Schedule maintenance
- [ ] Notify users (24h advance)
- [ ] Backup all data
- [ ] Test rollback procedure
- [ ] Perform updates
- [ ] Run verification tests
- [ ] Monitor for issues
- [ ] Confirm completion

## Tools & Resources

### Essential Commands

```bash
# Token info
npm run cli info

# Check balance
npm run cli balance <wallet>

# Monitor supply
npm run monitor

# Verify setup
npm run verify

# Test on devnet
npm run test:devnet
```

### External Tools

- **Solana Explorer**: https://explorer.solana.com
- **Solscan**: https://solscan.io
- **Step Finance**: https://app.step.finance

### Support Contacts

- Solana Discord: https://discord.gg/solana
- RPC Support: [Your provider's support]
- Internal Escalation: [Your team's contact]

## Compliance & Reporting

### Required Reports

1. **Daily Supply Report**
   - Current supply
   - Mint operations
   - Burn operations

2. **Weekly Authority Report**
   - Authority status
   - Changes made
   - Pending actions

3. **Monthly Audit**
   - All operations
   - Security incidents
   - Performance metrics

### Export Data

```bash
# Export transaction history
solana transaction-history <mint-address> > tx-history.txt

# Export supply data
npm run cli info --json > supply-report.json

# Generate compliance report
# (Custom script based on requirements)
```

## Contact & Escalation

### Emergency Contacts

1. **Technical Lead**: [Contact info]
2. **Security Team**: [Contact info]
3. **Legal/Compliance**: [Contact info]

### Escalation Path

1. **Operator** → Attempts resolution (15 min)
2. **Technical Lead** → Provides guidance (30 min)
3. **Security Team** → Handles security issues (immediate)
4. **Management** → Major decisions (as needed)

---

**Document Version**: 1.0
**Last Updated**: [Current Date]
**Next Review**: [Date + 3 months]
