import React from 'react';
import M3Provider from './M3Provider';

export const metadata = {
  title: "GreenSM MLOps Dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" />
      </head>
      <body>
        <M3Provider>
          {children}
        </M3Provider>
      </body>
    </html>
  );
}
