# Testing Guide

Comprehensive testing guide for the Solana Utility Token project.

## Table of Contents

- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Test Coverage](#test-coverage)
- [Unit Tests](#unit-tests)
- [Integration Tests](#integration-tests)
- [Writing Tests](#writing-tests)
- [Mocking](#mocking)
- [Best Practices](#best-practices)

## Test Structure

```
├── src/__tests__/           # Library unit tests
│   ├── operations/          # Token operations tests
│   │   ├── mint.test.ts
│   │   ├── burn.test.ts
│   │   ├── transfer.test.ts
│   │   ├── freeze.test.ts
│   │   └── metadata.test.ts
│   └── utils/               # Utility tests
│       └── validation.test.ts
├── cli/__tests__/           # CLI command tests
│   └── commands/
│       ├── mint.test.ts
│       ├── burn.test.ts
│       ├── transfer.test.ts
│       ├── freeze.test.ts
│       └── airdrop.test.ts
├── scripts/__tests__/       # Monitoring tests
│   └── monitoring/
│       ├── supply-tracker.test.ts
│       └── alerts.test.ts
└── admin/src/__tests__/     # Admin interface tests
    ├── components/
    └── hooks/
```

## Running Tests

### All Tests

```bash
npm test
```

### Watch Mode

```bash
npm run test:watch
```

### With Coverage

```bash
npm run test:coverage
```

### Specific Test File

```bash
npm test src/__tests__/operations/mint.test.ts
```

### Integration Tests

```bash
npm run test:integration
```

### CLI Tests

```bash
cd cli && npm test
```

### Admin Tests

```bash
cd admin && npm test
```

## Test Coverage

### Coverage Requirements

- **Minimum Coverage**: 85%
- **Branches**: 85%
- **Functions**: 85%
- **Lines**: 85%
- **Statements**: 85%

### View Coverage Report

After running `npm run test:coverage`:

```bash
# Open HTML report
open coverage/lcov-report/index.html
```

### Coverage by Module

| Module | Coverage | Status |
|--------|----------|--------|
| Token Operations | 90%+ | ✅ |
| Metadata Manager | 90%+ | ✅ |
| Wallet Utils | 95%+ | ✅ |
| CLI Commands | 85%+ | ✅ |
| Monitoring | 85%+ | ✅ |

## Unit Tests

### Token Operations Tests

**Location**: `src/__tests__/operations/`

Tests cover:
- Token creation
- Minting tokens
- Burning tokens
- Transferring tokens
- Freezing/thawing accounts
- Authority management
- Error handling
- Edge cases

**Example**:
```typescript
describe('TokenOperations - Mint', () => {
  it('should mint tokens successfully', async () => {
    const amount = 1000;
    const signature = await tokenOps.mintTokens(
      mint,
      destination,
      amount,
      decimals
    );
    expect(signature).toBeTruthy();
  });
});
```

### Metadata Tests

**Location**: `src/__tests__/operations/metadata.test.ts`

Tests cover:
- Metadata validation
- Image upload
- Metadata creation
- File generation
- Error scenarios

### Utility Tests

**Location**: `src/__tests__/utils/`

Tests cover:
- Wallet management
- Public key validation
- Keypair loading/saving
- Environment variable loading

### CLI Tests

**Location**: `cli/__tests__/commands/`

Tests cover:
- All CLI commands
- Argument parsing
- Error handling
- User confirmations
- File operations (airdrop)

### Monitoring Tests

**Location**: `scripts/__tests__/monitoring/`

Tests cover:
- Supply tracking
- Alert thresholds
- Webhook notifications
- Error handling

## Integration Tests

### Devnet Testing

```bash
npm run test:devnet
```

Integration tests:
- Create token on devnet
- Mint tokens
- Transfer tokens
- Burn tokens
- Freeze/thaw accounts
- Update metadata
- Revoke authorities

## Writing Tests

### Test Template

```typescript
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { YourClass } from '../../path/to/module';

jest.mock('@solana/spl-token');
jest.mock('../../utils/logger');

describe('YourClass - Feature', () => {
  let instance: YourClass;

  beforeEach(() => {
    instance = new YourClass(/* params */);
    jest.clearAllMocks();
  });

  describe('methodName', () => {
    it('should do something successfully', async () => {
      // Arrange
      const input = 'test';

      // Act
      const result = await instance.methodName(input);

      // Assert
      expect(result).toBeDefined();
      expect(result).toBe('expected');
    });

    it('should handle errors', async () => {
      // Arrange
      const invalidInput = null;

      // Act & Assert
      await expect(
        instance.methodName(invalidInput)
      ).rejects.toThrow('Error message');
    });
  });
});
```

### Test Naming Convention

- **Describe blocks**: Use the format `ClassName - Feature`
- **It blocks**: Use the format `should [behavior] [context]`

Examples:
- `should create token successfully`
- `should reject invalid amount`
- `should handle network errors`

## Mocking

### Mock Solana Dependencies

```typescript
jest.mock('@solana/spl-token');
jest.mock('@solana/web3.js');

(splToken.createMint as jest.Mock).mockResolvedValue(mockMint);
```

### Mock File System

```typescript
jest.mock('fs');

(fs.existsSync as jest.Mock).mockReturnValue(true);
(fs.readFileSync as jest.Mock).mockReturnValue('data');
```

### Mock Logger

```typescript
jest.mock('../../utils/logger');

// Logger is automatically mocked, no assertions needed
```

### Mock Axios (Webhooks)

```typescript
jest.mock('axios');

(axios.post as jest.Mock).mockResolvedValue({ data: { success: true } });
```

## Best Practices

### 1. AAA Pattern

Always use Arrange-Act-Assert:

```typescript
it('should do something', async () => {
  // Arrange
  const input = setupInput();

  // Act
  const result = await doSomething(input);

  // Assert
  expect(result).toBe(expected);
});
```

### 2. Test Independence

Each test should be independent:

```typescript
beforeEach(() => {
  // Reset state before each test
  jest.clearAllMocks();
  instance = new MyClass();
});
```

### 3. Test One Thing

Each test should verify one behavior:

```typescript
// Good
it('should return success status', async () => {
  const result = await operation();
  expect(result.success).toBe(true);
});

it('should return correct data', async () => {
  const result = await operation();
  expect(result.data).toEqual(expectedData);
});

// Bad
it('should work', async () => {
  const result = await operation();
  expect(result.success).toBe(true);
  expect(result.data).toEqual(expectedData);
  expect(result.timestamp).toBeDefined();
});
```

### 4. Descriptive Test Names

```typescript
// Good
it('should reject negative amounts', async () => {});
it('should create account when it does not exist', async () => {});

// Bad
it('test1', async () => {});
it('works', async () => {});
```

### 5. Test Error Cases

Always test error scenarios:

```typescript
it('should handle network timeout', async () => {
  mockConnection.sendTransaction.mockRejectedValue(
    new Error('Network timeout')
  );

  await expect(
    operation()
  ).rejects.toThrow('Network timeout');
});
```

### 6. Use Test Data Builders

Create helper functions for test data:

```typescript
function createMockTokenInfo(overrides = {}) {
  return {
    mintAddress: Keypair.generate().publicKey,
    decimals: 9,
    supply: BigInt(0),
    mintAuthority: Keypair.generate().publicKey,
    freezeAuthority: null,
    ...overrides,
  };
}
```

### 7. Avoid Test Interdependence

```typescript
// Bad - tests depend on execution order
describe('counter', () => {
  let count = 0;

  it('should increment', () => {
    count++;
    expect(count).toBe(1);
  });

  it('should increment again', () => {
    count++;
    expect(count).toBe(2); // Fails if run alone
  });
});

// Good - each test is independent
describe('counter', () => {
  it('should increment from zero', () => {
    const counter = new Counter();
    counter.increment();
    expect(counter.value).toBe(1);
  });
});
```

## Continuous Integration

Tests run automatically on:
- Pull requests
- Commits to main branch
- Before deployments

### CI Commands

```bash
# Full test suite
npm test

# With coverage report
npm run test:coverage

# Integration tests (devnet)
npm run test:devnet
```

## Troubleshooting

### Tests Timing Out

Increase timeout:
```typescript
jest.setTimeout(30000); // 30 seconds
```

### Mock Not Working

Ensure mocks are defined before imports:
```typescript
jest.mock('./module'); // Must be at top
import { function } from './module';
```

### Coverage Not Meeting Threshold

1. Check which files are uncovered:
   ```bash
   npm run test:coverage
   open coverage/lcov-report/index.html
   ```

2. Add tests for uncovered lines

3. Verify test files match pattern: `**/__tests__/**/*.test.ts`

### Integration Tests Failing

1. Check RPC endpoint is accessible
2. Verify wallet has SOL for fees
3. Check network status
4. Try devnet instead of mainnet

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Testing Library](https://testing-library.com/)
- [Solana Test Validator](https://docs.solana.com/developing/test-validator)
- [Best Practices](https://testingjavascript.com/)

## Support

For testing issues:
1. Check this guide
2. Review existing tests
3. Check Jest documentation
4. Open an issue with test output
