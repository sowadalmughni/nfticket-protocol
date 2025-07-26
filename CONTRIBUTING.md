# Contributing to NFTicket Protocol

Thank you for your interest in contributing to the NFTicket Anti-Scalping Protocol! This document provides guidelines and information for contributors.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Setup](#development-setup)
4. [Contributing Guidelines](#contributing-guidelines)
5. [Pull Request Process](#pull-request-process)
6. [Issue Reporting](#issue-reporting)
7. [Development Standards](#development-standards)
8. [Testing Requirements](#testing-requirements)
9. [Documentation](#documentation)
10. [Community](#community)

## Code of Conduct

This project adheres to a code of conduct that we expect all contributors to follow. Please read and follow these guidelines to ensure a welcoming environment for everyone.

### Our Standards

- **Be respectful**: Treat all community members with respect and kindness
- **Be inclusive**: Welcome newcomers and help them get started
- **Be collaborative**: Work together to improve the project
- **Be constructive**: Provide helpful feedback and suggestions
- **Be professional**: Maintain a professional tone in all interactions

### Unacceptable Behavior

- Harassment, discrimination, or offensive comments
- Personal attacks or trolling
- Spam or irrelevant content
- Sharing private information without permission
- Any behavior that would be inappropriate in a professional setting

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- Node.js 18+ installed
- Git installed and configured
- A GitHub account
- Basic knowledge of Solidity, JavaScript/TypeScript, and React
- Understanding of blockchain and Web3 concepts

### First Contribution

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/nfticket-protocol.git
   cd nfticket-protocol
   ```
3. **Install dependencies**:
   ```bash
   npm install
   cd nfticket-dashboard && pnpm install && cd ..
   cd mobile-app/NFTicketApp && npm install && cd ../..
   ```
4. **Create a branch** for your contribution:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Setup

### Local Environment

1. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

2. **Start local blockchain**:
   ```bash
   npx hardhat node
   ```

3. **Deploy contracts locally**:
   ```bash
   npm run deploy:local
   ```

4. **Start development servers**:
   ```bash
   # Terminal 1: Dashboard
   npm run dashboard:dev
   
   # Terminal 2: Mobile app (optional)
   npm run mobile:start
   ```

### Testing Setup

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npx hardhat test test/NFTicket.test.js
```

## Contributing Guidelines

### Types of Contributions

We welcome various types of contributions:

- **Bug fixes**: Fix issues in smart contracts, frontend, or mobile app
- **Feature additions**: Add new functionality to the protocol
- **Documentation**: Improve or add documentation
- **Testing**: Add or improve test coverage
- **Performance**: Optimize gas usage or application performance
- **Security**: Identify and fix security vulnerabilities
- **UI/UX**: Improve user interface and experience

### Contribution Areas

#### Smart Contracts
- Gas optimization
- Security improvements
- New features (with careful consideration)
- Bug fixes
- Test coverage improvements

#### Frontend Dashboard
- New features and pages
- UI/UX improvements
- Performance optimizations
- Accessibility improvements
- Mobile responsiveness

#### Mobile Application
- Cross-platform compatibility
- Offline functionality
- User experience improvements
- Performance optimizations

#### Documentation
- API documentation
- User guides
- Developer tutorials
- Code comments
- README improvements

## Pull Request Process

### Before Submitting

1. **Check existing issues** to avoid duplicates
2. **Create an issue** for significant changes to discuss the approach
3. **Follow coding standards** outlined below
4. **Write or update tests** for your changes
5. **Update documentation** as needed
6. **Test thoroughly** on local environment

### Submission Steps

1. **Ensure your branch is up to date**:
   ```bash
   git checkout main
   git pull upstream main
   git checkout your-branch
   git rebase main
   ```

2. **Run all tests and linting**:
   ```bash
   npm test
   npm run lint
   npm run format
   ```

3. **Commit your changes** with clear messages:
   ```bash
   git add .
   git commit -m "feat: add ticket transfer validation"
   ```

4. **Push to your fork**:
   ```bash
   git push origin your-branch
   ```

5. **Create a pull request** on GitHub with:
   - Clear title and description
   - Reference to related issues
   - Screenshots for UI changes
   - Test results and coverage

### Pull Request Template

```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issues
Fixes #(issue number)

## Testing
- [ ] Tests pass locally
- [ ] New tests added for new functionality
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots for UI changes.

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings or errors
```

### Review Process

1. **Automated checks** must pass (tests, linting, security scans)
2. **Code review** by maintainers
3. **Testing** on different environments
4. **Approval** from at least one maintainer
5. **Merge** after all requirements are met

## Issue Reporting

### Bug Reports

When reporting bugs, include:

- **Clear title** describing the issue
- **Steps to reproduce** the bug
- **Expected behavior** vs actual behavior
- **Environment details** (OS, browser, Node version, etc.)
- **Screenshots or logs** if applicable
- **Minimal reproduction** example if possible

### Feature Requests

For feature requests, provide:

- **Clear description** of the proposed feature
- **Use case** and motivation
- **Proposed implementation** approach
- **Potential impact** on existing functionality
- **Alternative solutions** considered

### Security Issues

For security vulnerabilities:

- **Do not** create public issues
- **Email** security concerns to [security@example.com]
- **Provide** detailed information about the vulnerability
- **Wait** for acknowledgment before public disclosure

## Development Standards

### Code Style

#### Solidity
```solidity
// Use clear, descriptive names
contract NFTicket is ERC721, Ownable, ReentrancyGuard {
    // State variables with visibility
    uint256 public royaltyCap;
    
    // Events with indexed parameters
    event TicketMinted(uint256 indexed tokenId, address indexed to);
    
    // Functions with clear documentation
    /**
     * @notice Mints a new ticket NFT
     * @param to Address to mint the ticket to
     * @param uri Metadata URI for the ticket
     * @return tokenId The newly minted token ID
     */
    function mintTicket(address to, string memory uri) 
        external 
        onlyOwner 
        returns (uint256) 
    {
        // Implementation
    }
}
```

#### JavaScript/TypeScript
```javascript
// Use descriptive function names
async function getUserTickets(userAddress) {
  try {
    const contract = new ethers.Contract(address, abi, provider);
    const balance = await contract.balanceOf(userAddress);
    
    // Process results
    return {
      success: true,
      tickets: processedTickets,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}
```

#### React Components
```jsx
/**
 * TicketCard Component
 * Displays individual ticket information
 */
export function TicketCard({ ticket, onTransfer, onUse }) {
  const [loading, setLoading] = useState(false);
  
  const handleUse = async () => {
    setLoading(true);
    try {
      await onUse(ticket.tokenId);
    } catch (error) {
      console.error('Failed to use ticket:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="ticket-card">
      {/* Component JSX */}
    </div>
  );
}
```

### Commit Messages

Follow conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test additions or modifications
- `chore`: Maintenance tasks

Examples:
```
feat(contracts): add royalty cap validation
fix(dashboard): resolve wallet connection issue
docs(api): update contract interaction examples
test(mobile): add QR code generation tests
```

### File Organization

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Basic UI components
│   └── features/       # Feature-specific components
├── pages/              # Page components
├── hooks/              # Custom React hooks
├── services/           # API and Web3 services
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
└── constants/          # Application constants
```

## Testing Requirements

### Smart Contract Tests

```javascript
describe("NFTicket", function () {
  let nfticket, owner, user1, user2;
  
  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    const NFTicket = await ethers.getContractFactory("NFTicket");
    nfticket = await NFTicket.deploy(
      "Test Event",
      "Test Description",
      Math.floor(Date.now() / 1000) + 86400,
      "Test Venue",
      500,
      ethers.utils.parseEther("1.0"),
      owner.address
    );
  });
  
  it("should mint tickets correctly", async function () {
    const tx = await nfticket.mintTicket(
      user1.address,
      "https://example.com/metadata/1",
      ethers.utils.parseEther("0.1")
    );
    
    expect(await nfticket.ownerOf(1)).to.equal(user1.address);
  });
});
```

### Frontend Tests

```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import { TicketCard } from '../components/TicketCard';

describe('TicketCard', () => {
  const mockTicket = {
    tokenId: '1',
    owner: '0x123...',
    used: false,
    metadata: {
      name: 'Test Ticket',
      image: 'https://example.com/image.png'
    }
  };
  
  it('renders ticket information correctly', () => {
    render(<TicketCard ticket={mockTicket} />);
    
    expect(screen.getByText('Test Ticket')).toBeInTheDocument();
    expect(screen.getByText('Token ID: 1')).toBeInTheDocument();
  });
  
  it('calls onUse when use button is clicked', () => {
    const mockOnUse = jest.fn();
    render(<TicketCard ticket={mockTicket} onUse={mockOnUse} />);
    
    fireEvent.click(screen.getByText('Use Ticket'));
    expect(mockOnUse).toHaveBeenCalledWith('1');
  });
});
```

### Test Coverage Requirements

- **Smart contracts**: Minimum 90% coverage
- **Frontend components**: Minimum 80% coverage
- **Critical functions**: 100% coverage required
- **Integration tests**: Cover main user flows

## Documentation

### Code Documentation

- **Smart contracts**: Use NatSpec comments
- **Functions**: Document parameters, return values, and side effects
- **Complex logic**: Add inline comments explaining the approach
- **APIs**: Provide complete examples and error handling

### User Documentation

- **README**: Keep updated with latest features
- **API Reference**: Document all public interfaces
- **Deployment Guide**: Step-by-step instructions
- **Troubleshooting**: Common issues and solutions

### Examples

Provide working examples for:
- Contract deployment
- Frontend integration
- Mobile app usage
- API interactions

## Community

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and ideas
- **Discord**: Real-time community chat (if available)
- **Twitter**: Updates and announcements

### Getting Help

1. **Check documentation** first
2. **Search existing issues** for similar problems
3. **Ask in discussions** for general questions
4. **Create an issue** for bugs or specific problems
5. **Join community chat** for real-time help

### Recognition

Contributors will be recognized through:
- **Contributors list** in README
- **Release notes** mentioning significant contributions
- **Special badges** for major contributors
- **Community highlights** for exceptional work

## Release Process

### Version Numbering

We follow semantic versioning (SemVer):
- **Major** (1.0.0): Breaking changes
- **Minor** (0.1.0): New features, backward compatible
- **Patch** (0.0.1): Bug fixes, backward compatible

### Release Checklist

- [ ] All tests passing
- [ ] Documentation updated
- [ ] Security audit completed (for major releases)
- [ ] Migration guide prepared (for breaking changes)
- [ ] Release notes written
- [ ] Contracts verified on block explorers

---

Thank you for contributing to the NFTicket Protocol! Your efforts help make Web3 events more accessible and fair for everyone.

