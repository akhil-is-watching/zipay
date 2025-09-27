# @zipay/ui-components

Shared React component library for the Zipay monorepo.

## Installation

From the root of the monorepo:
```bash
make install-components
```

Or directly:
```bash
cd ui-components && bun install
```

## Development

Run in watch mode:
```bash
make dev-components
```

## Build

```bash
make build-components
```

## Usage in UI Package

The component library is already linked to the UI package via workspace. Import components like:

```tsx
import { Button, Card } from '@zipay/ui-components';

function MyComponent() {
  return (
    <Card title="Example Card">
      <Button variant="primary" size="md">
        Click me
      </Button>
    </Card>
  );
}
```

## Available Components

### Button
Props:
- `variant`: 'primary' | 'secondary' | 'outline' | 'ghost'
- `size`: 'sm' | 'md' | 'lg'
- `fullWidth`: boolean
- `loading`: boolean

### Card
Props:
- `title`: string
- `subtitle`: string
- `footer`: ReactNode
- `variant`: 'default' | 'bordered' | 'shadow'
- `padding`: 'none' | 'sm' | 'md' | 'lg'