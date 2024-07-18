import express from 'express';


const app = express(); 

app.use(express.static('dist'))

app.get('/', (req, res) => {
    res.send('Server is ready');
});

app.get('/api/jokes', (req, res) => {
    const jokes = [
        {
            id: 1,
            title: 'joke 1',
            content: 'this is a joke'
        },
        {
            id: 2,
            title: 'joke 2',
            content: 'this is another joke'
        },
        {
            id: 3,
            title: 'joke 3',
            content: 'this is the third joke'
        },
        {
            id: 4,
            title: 'joke 4',
            content: 'this is the fourth joke'
        },
        {
            id: 5,
            title: 'joke 5',
            content: 'this is the fifth joke'
        }
    ]
    res.send(jokes);
})

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
