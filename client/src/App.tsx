import React from 'react';
import './App.css';
import querystring from 'querystring';
import Twemoji from 'react-twemoji';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";

/*
	These define in which form the Client wants the data to be returned 
	Most properties are optional, as the server is able to send any kind of post back
*/

type Image = {
	full: string,
	animated?: string,
	preview?: string,
}

type PostProps = {
	id: string,
	service: string,
	title?: string,
	text?: string,
	images?: Image[],
	author?: string,
	sub?: string,
}

type Options = {
	dark: boolean,
}

type Auth = {
	service: string
}

type User = {
	username: string,
	options: Options,
	auths: Auth[],
}

class Author extends React.Component<{author: string},{}> {

	render() {
		const { author } = this.props;
		const icons = ['👷‍♂️', '🙍‍♀️', '🙍‍♂️', '🧙‍♂️', '💂‍♀️', '🕵️‍♂️', '👩‍🎓', '👩‍🏫', '👩‍🌾', '👩‍🔬', '👨‍🏭', '👨‍🎤', '🧕'];

		return (
			<div className='author'>
				<span>{icons[Math.floor(Math.random() * icons.length)]}</span>
				<p className='author-tooltip'>{author}</p>
			</div>
		);
	}

}

class Post extends React.Component<{post: PostProps, app: App},{}> {

	maxLength = 500;

	render() {
		const { app, post } = this.props;
		const { text, images, title, service, author, sub } = post;

		const tooBig = text && text.length > this.maxLength; 

		return (
			<div className={`post ${tooBig ? 'minimize' : ''}`} onClick={() => app.selectPost(post)}>
				<Link to='/'>

						<div className='row w-100 m-0'>
							{title && <h1 className='title'>{title}</h1>}
							<p className='service align-self-end col'>{service}{sub && ` / ${sub}`}</p>
						</div>

						<div className='row'>
							{text && <p className='col text' dangerouslySetInnerHTML={{__html: text}}></p>}
							{(images && images.length > 0) &&
								 <div className='col'>
									 <div className='row align-items-center'>
										{images.map((image, i) => 
											<img onClick={() => app.selectPost(post, i)} key={i} alt={text} className={text ? '' : 'single'} src={image.preview || image.full}></img>
										)}
									</div>
								</div>
							}
						</div>
						{author && <Author author={author} />}
				</Link>
			</div>
		);
	}

}

type SliderProps = {images: {src: string, alt?: string}[], active: number};
class Slider extends React.Component<SliderProps,{active: number}> {

	constructor(props: SliderProps) {
		super(props);
		this.state = {active: props.active};
	}

	swipe(i: number) {
		const images = this.props.images;
		const active = Math.min(images.length - 1, Math.max(0, this.state.active + i));
		this.setState({ active });
	}

	render() {
		const { images } = this.props;
		const { active } = this.state;

		const multiple = images.length > 1;

		return (
			<div className='slider mb-3'>
			{(multiple && active > 0) && <div onClick={() => this.swipe(-1)} className='previous'></div>}
				{images.map((img, i) => {
					let s = '';
					if(active !== i)  s += (active > i ? 'hidden-left' : 'hidden-right');
					return <img key={i} className={s} alt={img.alt} src={img.src}></img>
				})}
			{(multiple && active < images.length - 1) && <div onClick={() => this.swipe(+1)} className='next'></div>}
			</div>
		);
	}

}

class BigPost extends React.Component<{post: PostProps, active: number},{}> {

	render() {
		const { post, active } = this.props;
		const { text, images, title } = post;
 
		return (
			<div className='row justify-content-center w-100 h-100'>
				<div className='col align-self-center'>
					{title && <h1 className='title mb-4'>{title}</h1>}
					{(images && images.length > 0) && <Slider active={active} images={images.map(i => { return {src: i.animated || i.full, alt: title || text}})} />}
					{text && <p dangerouslySetInnerHTML={{__html: text}}></p>}
				</div>
			</div>
		);
	}

}

class Feed extends React.Component<{app: App},{posts: PostProps[], message?: string, loadingProcess: number, loading: boolean, data: any}> {

	total = 5;

	constructor(props: any) {
		super(props);
		this.state = {posts: [], loadingProcess: 0, loading: false, data: {}};
	}

	/**
		Sends a request to the server to load new posts
		The data retrieved with the last request is sent as a query parameter

		@param {number} count: the amount of posts to load
	*/
	fetchPosts(count = 30) {
		this.setState({ loading: true, loadingProcess: 0 })

		const { data } = this.state;
		data.count = count;

		fetch(`/posts?${querystring.encode(data)}`)
			.then(res => res.json())
			.then(res => {
				let { posts, data, message } = res;

				if(posts) {
					posts = [...this.state.posts, ...posts];
					this.setState({ posts, loading: false, data, message });
				} else {
					this.setState({ message: message });
					window.setTimeout(() => this.fetchPosts(count), 1000);
				}

			})
			.catch(e => {
				this.setState({ message: 'Server Offline' });
				window.setTimeout(() => this.fetchPosts(count), 1000);
			});

	}

	componentDidMount() {
		this.fetchPosts();

		window.setInterval(() => {
			let { loadingProcess } = this.state;
			if(loadingProcess > 0) {
				loadingProcess--;
				this.setState({ loadingProcess })
			}
		}, 100);
	}

	scroll(e: React.WheelEvent) {
		let { loadingProcess, loading } = this.state;
		if(loading) return;

		loadingProcess++;

		if(e.deltaY > 0) {
			const scroll = e.currentTarget.scrollHeight - e.currentTarget.scrollTop;
			const height = e.currentTarget.getBoundingClientRect().height;
			if(scroll - height < 500) {
				if(loadingProcess > this.total)
					this.fetchPosts();
				else
					this.setState({ loadingProcess });
			}
		}
	}

	render() {
		const { posts, loadingProcess, loading, message } = this.state;
		const { app } = this.props;
		const showLoading = loadingProcess > 0 || loading;

		return (
			<div className='feed' onWheel={e => this.scroll(e)}>
				{<h2 className='mt-2 mb-5 message'>{message ? message : "You've reached the top"}</h2>}
				{posts.map((post, i) => <Post key={i} post={post} app={app} />)}

				<div className={`loading ${showLoading ? '' : 'hidden'} ${loading ? 'process' : ''}`}></div>
			</div>
		);
	}

}

class Profile extends React.Component<{user: User},{}> {

	render() {
		const { user } = this.props;
		const icons = ['👷‍♂️', '🙍‍♀️', '🙍‍♂️', '🧙‍♂️', '💂‍♀️', '🕵️‍♂️', '👩‍🎓', '👩‍🏫', '👩‍🌾', '👩‍🔬', '👨‍🏭', '👨‍🎤', '🧕'];

		return (
			<>
				<h1>Profile</h1>
				<h3 className='my-2'>{user.username}</h3>
				<Twemoji>
					{icons[Math.floor(Math.random() * icons.length)]}
				</Twemoji>
			</>
		);
	}

}

type update = () => void;

class Setting extends React.Component<{option: string, value: any, update: update},{}> {

	set(value: any) {
		const { option, update } = this.props;

		fetch('/settings', { 
				method: 'POST',
				body: JSON.stringify({ value, option }), 
		        headers: {
		            "Content-Type": "application/json; charset=utf-8",
		        },
			})
			.then(r => update())
	}

	render() {
		const { option, value } = this.props;

		let input;
		if(typeof value === 'boolean') 
			input = <input onChange={() => this.set(!value)} type='checkbox' checked={value}></input>;

		if(!input) return null;

		return (
			<p className='setting'>
				<span>{option}: </span>
				<span>{input}</span>
			</p>
		)
	}

}

class Settings extends React.Component<{options: Options, update: update},{}> {

	registerService(service: string) {
		fetch(`/register/${service}`)
			.then(res => res.json())
			.then(json => {
				if(json.uri) window.open(json.uri, '_self');
			});
	}

	render() {
		const { options, update } : any = this.props;

		const services = ['reddit', 'twitter'];

		return (
			<>
				<h1>Settings</h1>
				{Object.keys(options).map(key => <Setting update={update} key={key} option={key} value={options[key]} />)}
				
				<h2 className='mt-5 mb-3'>Your Services</h2>
				{services.map(service =>
					<div key={service} className='my-2'><button className={`service ${service}`} onClick={() => this.registerService(service)} >{service}</button></div>
				)}
			</>
		);
	}

}

type Multifeed = {
	name: string,
};

class Feeds extends React.Component<{},{}> {

	select(feed: Multifeed, e: any) {
		e.preventDefault();
	}

	render() {

		const feeds: Multifeed[] = [
			{ name: 'all' },
			{ name: 'none' }
		];

		return (
			<>
				<h1>Feeds</h1>
				<div className='px-2 mt-5'>
					{feeds.map((feed, i) =>
						<div key={feed.name} className={`multifeed row ${i === 0 ? 'selected' : ''}`}>
							<input checked={i === 0} className='col' onClick={e => this.select(feed, e)} type='radio'></input>
							<div className='col'><span>{feed.name}</span></div>
						</div>
					)}
				</div>
			</>
		);
	}

}

type Screen = { element: JSX.Element, key: string };
type Screens = ({ icon: string } & Screen)[]

class Sidebar extends React.Component<{screen?: Screen, last?: Screen, buttons: Screens, app: App},{}> {

	constructor(props: any) {
		super(props);
		this.state = {};
	}

	render() {
		const { screen, buttons, app, last } = this.props;

		return (
			<div className='sidebar col row'>
				<SidebarButtons screens={buttons} minimized={screen !== undefined} sidebar={app} />
				{screen && <div id={screen.key} key={screen.key} className='screen'>{screen.element}</div>}
				{last && <div id={last.key} key={`${last.key}-last`} className='screen last'>{last.element}</div>}
			</div>
		);
	}

}

class SidebarButtons extends React.Component<{sidebar: App, minimized: boolean, screens: Screens},{}> {

	render() {
		const { sidebar, minimized, screens } = this.props;

		return (
			<Twemoji>
				<Link onClick={() => sidebar.select()} className={minimized ? '' : 'disabled'} to='/'>
					<div key={minimized ? 'min' : 'max'} className={`buttons ${minimized ? 'minimized' : ''}`}>
						{screens.map((screen) =>
							<Link key={screen.key} className={minimized ? 'disabled' : ''} to={`/${screen.key}`}>
								<button>
									{screen.icon}
								</button>
							</Link>
						)}
					</div>
				</Link>
			</Twemoji>
		);
	}

}

class App extends React.Component<{},{user?: User, screen?: Screen, last?: Screen}> {

	constructor(props: any) {
		super(props);
		this.state = {};
	}

	select(screen?: Screen) {
		const last = this.state.screen;
		if(!last || !screen || last.key !== screen.key)
			this.setState({ screen, last });
	}

	selectPost(post: PostProps, image = 0) {
		this.select({element: <BigPost post={post} active={image} />, key: post.id});
	}

	getUser() {
		fetch('/user')
			.then(res => res.json())
			.then(user => this.setState({ user }))
			.catch(e => {
				window.setTimeout(() => this.getUser(), 1000);
			});
	}

	componentDidMount() {
		this.getUser();
	}

	render() {
		const { user, last, screen } = this.state;

		const buttons: Screens = [];

		if(user) {
			buttons.push({key: 'settings', icon: '⚙', element: <Settings update={() => this.getUser()} options={user.options} />});
			buttons.push({key: 'profile', icon: '🧙‍♂️', element: <Profile user={user} />});
			buttons.push({key: 'fam', icon: '💯', element: <h1>Lit Fam</h1>});
			buttons.push({key: 'feeds', icon: '🍽', element: <Feeds />});
		}

		return (
				<Router>
				<div className={`app row m-0 ${(user && user.options.dark) ? 'dark' : ''}`}>

					<Feed app={this} />

					<Switch>
						{buttons.map(button => 
							<Route key={button.key} path={`/${button.key}`}>
								<Sidebar app={this} screen={button} last={last} buttons={buttons} />
							</Route>
						)}
						<Route path='/'>
							<Sidebar app={this} screen={screen} last={last} buttons={buttons} />
						</Route>
					</Switch>
				
				</div>
			</Router>
		);
	}
}

export default App;