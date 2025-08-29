import app from './app.js'
import connectDB from './db.js'

const PORT = process.env.PORT || 5000;

connectDB();
app.listen(PORT, () => {
    console.log(
        `Fino server running at port ${PORT}`
    );
});