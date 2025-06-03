# Daily Inventory PWA

A Progressive Web Application for tracking daily personal inventory and spiritual growth.

## Features

- Daily inventory tracking with self-will vs. God's will characteristics
- Interactive charts showing daily and average progress
- Offline functionality with service worker support
- Mobile-responsive design
- Install as PWA on various devices
- Data export/import functionality
- Timezone-aware date handling
- Calendar widget with Today button
- Local storage for data persistence

## Tech Stack

- HTML5
- CSS3
- JavaScript (ES6+)
- Bootstrap 5
- Chart.js
- Day.js
- jQuery & jQuery UI
- Webpack 5
- Babel

## Development Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/dailyinventory.github.io.git
cd dailyinventory.github.io
```

2. Install dependencies:
```bash
npm install
```

3. Generate icons:
```bash
npm run generate-icons
```

4. Start development server:
```bash
npm start
```

5. Build for production:
```bash
npm run build
```

## Project Structure

```
dailyinventory.github.io/
├── assets/
│   ├── css/
│   │   ├── styles.css
│   │   └── jquery-ui.css
│   ├── js/
│   │   ├── script.js
│   └── images/
│       └── icons/
├── dist/           # Production build output
├── index.html
├── manifest.json
├── package.json
├── webpack.config.js
├── postcss.config.js
├── generate-favicon.js
└── README.md
```

## Key Features

### Calendar Widget
- Date selection with jQuery UI datepicker
- Today button for quick navigation
- Past date selection for historical data
- Future date prevention
- Timezone-aware date handling

### Data Management
- Local storage for data persistence
- Export/Import functionality
- Automatic data saving
- Data validation

### UI/UX
- Responsive design for all devices
- Interactive charts
- Clear visual feedback
- Intuitive navigation
- Bootstrap 5 styling

## Building and Deployment

1. Development:
```bash
npm start
```
This starts the webpack dev server on port 8080 with hot reloading.

2. Production Build:
```bash
npm run build
```
This creates an optimized production build in the `dist` directory.

3. Clean Build:
```bash
npm run clean && npm run build
```
This removes the dist directory and creates a fresh production build.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Android Chrome)

## PWA Installation

The app can be installed as a PWA on:
- iOS devices (via Safari)
- Android devices (via Chrome)
- Windows (via Edge)
- Desktop browsers that support PWA installation

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Acknowledgments

- Bootstrap for the UI framework
- Chart.js for data visualization
- Day.js for date handling
- jQuery for DOM manipulation 