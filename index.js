const express = require('express');
const fs = require('fs');
const axios = require('axios');
const path = require('path');
const app = express();
const PORT = 5000;

app.use(express.json());

// 📚 Fetch books from external API
app.get('/api/books', async (req, res) => {
  const query = req.query.q || 'harry potter';

  try {
    const response = await axios.get('https://www.googleapis.com/books/v1/volumes', {
      params: {
        q: query,
        maxResults: 10,
      },
    });

    const books = response.data.items.map(item => ({
      id: item.id,
      title: item.volumeInfo.title,
      authors: item.volumeInfo.authors,
      description: item.volumeInfo.description,
      previewLink: item.volumeInfo.previewLink,
      thumbnail: item.volumeInfo.imageLinks?.thumbnail,
    }));

    res.json(books);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Failed to fetch books from external API' });
  }
});

// 📖 Utility function: Read bookmarks file
function readBookmarks() {
  const data = fs.readFileSync(path.join(__dirname, 'bookmarks.json'), 'utf-8');
  return JSON.parse(data);
}

// 💾 Utility function: Write bookmarks file
function writeBookmarks(bookmarks) {
  fs.writeFileSync(path.join(__dirname, 'bookmarks.json'), JSON.stringify(bookmarks, null, 2));
}

// 📥 Get all bookmarks
app.get('/api/bookmarks', (req, res) => {
  const bookmarks = readBookmarks();
  res.json(bookmarks);
});

// ➕ Add a new bookmark
app.post('/api/bookmarks', (req, res) => {
  const newBookmark = req.body;

  if (!newBookmark.id || !newBookmark.title) {
    return res.status(400).json({ error: 'Missing book id or title' });
  }

  const bookmarks = readBookmarks();

  // Avoid duplicates
  if (bookmarks.find(b => b.id === newBookmark.id)) {
    return res.status(409).json({ error: 'Bookmark already exists' });
  }

  bookmarks.push(newBookmark);
  writeBookmarks(bookmarks);

  res.status(201).json({ message: 'Bookmark added' });
});

// ❌ Delete a bookmark
app.delete('/api/bookmarks/:id', (req, res) => {
  const id = req.params.id;
  let bookmarks = readBookmarks();

  const index = bookmarks.findIndex(b => b.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Bookmark not found' });
  }

  bookmarks.splice(index, 1);
  writeBookmarks(bookmarks);

  res.json({ message: 'Bookmark removed' });
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
