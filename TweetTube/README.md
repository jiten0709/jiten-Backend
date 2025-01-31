# TweetTube

This project provides a backend API for a video and tweet platform, enabling users to manage videos, tweets, playlists, comments, subscriptions, and more. Built with Node.js, Express, and Mongoose, this API is designed to be scalable and secure.

## Services Used

- `MongoDB Atlas Database`
- `Mongoose`
- `Express`
- `CORS`
- `cookie-parser`
- `mongoose-paginate-v2`
- `bcrypt`
- `jsonwebtoken`
- `cloudinary`
- `multer`
- `dotenv`

## Features

- **User Authentication**: Secure user authentication using bcrypt and JSON Web Tokens.
- **Video Management**: Upload, update, delete, and retrieve videos.
- **Tweet Management**: Post, update, delete, and retrieve tweets.
- **Playlist Management**: Create, update, delete, and retrieve playlists.
- **Comment System**: Add, update, delete, and retrieve comments on videos and tweets.
- **Subscription System**: Subscribe and unsubscribe to channels.
- **File Uploads**: Handle file uploads using multer and Cloudinary.
- **Pagination**: Efficiently paginate through large sets of data using mongoose-paginate-v2 and mongoose-aggregate-paginate-v2.

## Getting Started

### Prerequisites

- Node.js
- npm

### Installation

1. Clone the repository:

   ```sh
   git clone https://github.com/jiten0709/jiten-Backend.git
   cd TweetTube
   ```

2. Install dependencies:

   ```sh
   npm install
   ```

3. Set up environment variables:
   Create a [.env](http://_vscodecontentref_/1) file in the root of your project and refer .env.sample file.

### Running the Project

Start the development server:

```sh
npm run dev
```

# Database Design.

- [Model link](https://app.eraser.io/workspace/YtPqZ1VogxGy1jzIDkzj?origin=share)
