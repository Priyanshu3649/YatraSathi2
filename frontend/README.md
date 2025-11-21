# YatraSathi Frontend

This is the frontend application for the YatraSathi Travel Agency system, built with React and Vite.

## Features

- User authentication (login/register)
- Role-based dashboards
- Booking management
- Payment tracking
- User profile management
- Responsive design

## Tech Stack

- **React** - Frontend library
- **Vite** - Build tool
- **React Router** - Client-side routing
- **CSS Modules** - Styling

## Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/          # Page components
├── utils/          # Utility functions
├── contexts/       # React contexts
├── hooks/          # Custom hooks
├── assets/         # Static assets
├── styles/         # Global styles
└── services/       # API services
```

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   ```

2. Navigate to the frontend directory:
   ```
   cd frontend
   ```

3. Install dependencies:
   ```
   npm install
   ```

### Development

To start the development server:

```
npm run dev
```

The application will be available at `http://localhost:3000`.

### Building for Production

To create a production build:

```
npm run build
```

### Previewing Production Build

To preview the production build locally:

```
npm run preview
```

## Environment Variables

Create a `.env` file in the frontend directory with the following variables:

```
VITE_API_URL=http://localhost:5000/api
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## API Integration

The frontend communicates with the backend API through the `/api` proxy configured in `vite.config.js`. All API requests are handled through the `api.js` utility in the `src/utils` directory.

## Authentication

The application uses JWT tokens for authentication, which are stored in localStorage. The `AuthContext` provides authentication state and functions throughout the application.

## Routing

The application uses React Router for client-side routing. Protected routes can be implemented using route guards in the future.

## Styling

The application uses CSS modules for component-specific styling and global CSS for shared styles.

## Deployment

To deploy the frontend application:

1. Build the application:
   ```
   npm run build
   ```

2. Deploy the `dist` folder to your preferred hosting platform.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Commit your changes
5. Push to the branch
6. Create a pull request

## License

ISC