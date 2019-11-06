import express from 'express';
import Reddit from './services/reddit';

const bodyParser = require('body-parser')
const path = require('path');
const app = express();

import { User, Options, Auth } from './database';

app.use(express.static(path.join(__dirname, 'build')));

new Reddit().register(app);

app.get('/user', async (req, res) => {
	try {

		const user = await User.getUser();
		if(user) {
			const options = await user.getOptions();
			res.json(user);
		} else res.send('Not Found');
	
	} catch(e) { res.send(`<h3>${e}</h3><br><p>${JSON.stringify(e)}</p>`) }
})

app.get('/posts', async (req, res) => {

	const posts = await new Reddit().posts();
	res.json(posts);

});

app.get('*', (req, res) => {
	res.send('Not found');
});

app.listen(process.env.PORT || 8080, () => console.log('Started Server'));