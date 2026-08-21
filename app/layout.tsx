export const metadata = {
  title: 'Giá Vàng Real-time',
  description: 'Giá vàng thế giới và Việt Nam real-time',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body style={{ margin: 0, overscrollBehavior: 'none' }}>
        {children}
      </body>
    </html>
  )
}
