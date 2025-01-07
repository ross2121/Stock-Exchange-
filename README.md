Stock Exchange Platform

Project Overview

This project is a real-time stock exchange platform that allows users to buy and sell stocks seamlessly. The application mimics a backpack exchange, where trades are executed instantly between users. The system leverages Redis Pub/Sub for real-time messaging and WebSocket connections to ensure live updates and interactions.

Features

Real-time Trading: Users can place buy and sell orders that are instantly reflected across the platform.

WebSocket Integration: Live updates for stock prices, order books, and trade history.

Redis Pub/Sub: Efficient communication between different services, ensuring instant data propagation.

Order Matching Engine: Automated matching of buy and sell orders to facilitate quick transactions.

User Portfolio Management: Users can track their portfolio, view holdings, and analyze profit/loss in real-time.

Dynamic Pricing: Stock prices fluctuate based on market activity.

Secure Transactions: All trades and user data are securely handled.

Tech Stack

Frontend: React.js with WebSocket for real-time updates.

Backend: Node.js and Express.

Database: MongoDB for persistent data storage.

Real-time Data: Redis Pub/Sub for event-driven architecture.

WebSocket: Ensuring seamless real-time communication between the server and the client.

How it Works

User Interaction: Users can place buy/sell orders through the frontend interface.

Order Processing: Orders are processed and published to Redis channels.

Real-time Updates: Redis Pub/Sub broadcasts order updates to all subscribed clients.

Order Matching: Buy and sell orders are matched in real-time, and WebSocket pushes updates to users.
