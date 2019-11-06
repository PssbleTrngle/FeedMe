import express from 'express';
import Reddit from './services/reddit';
import Random from './services/random';
import Service from './service';

const bodyParser = require('body-parser')
const path = require('path');
const app = express();

import { User, Options, Auth } from './database';

app.use(express.static(path.join(__dirname, 'build')));

const Services: Service[] = [
	new Reddit(),
	new Random(),
];

Services.forEach(s => s.register(app));

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

	const user = await User.getUser();
	const auths = user ? await user.getAuths() : undefined;

	const services = Services.filter(s => !s.createOAuth() || (auths && auths.find(a => a.service == s.name())))

	if(services.length) {

		const total = req.query.count || 1;

		const retrieve = async (services) => {
			const posts: any[] = [];
			while(posts.length < total)
				for(let service of services) {

					try {
					
						const p = await service.posts();

						p.forEach(post => {
							post.service = service.name();
							posts.push(post);
						})
					
					} catch(e) {
						posts.push({ text: `Error at ${service.name()}` });
					}

				}
			return posts;
		};

		const posts = await retrieve(services);
		res.send(posts);

	} else
		res.send({ message: 'You have no registed services 😢' });

});

app.get('*', (req, res) => {
	res.send('Not found');
});

app.listen(process.env.PORT || 8080, () => console.log('Started Server'));