import React from 'react';
import './App.css';

type PostProps = {
	id: string
	text?: string,
	image?: string,
}

class Post extends React.Component<{post: PostProps, app: App},{}> {

	render() {
		const { app, post } = this.props;
		const { text, image } = post;

		return (
			<div className='post row' onClick={() => app.selectPost(post)}>
				{text && <p className='col'>{text}</p>}
				{image &&
					 <div className='col'>
						 <div className='row justify-content-end'>
							<img alt={text} className={text ? '' : 'single'} src={image}></img>
						</div>
					</div>
				}
			</div>
		);
	}

}

class BigPost extends React.Component<{post: PostProps},{}> {

	render() {
		const { text, image } = this.props.post;

		return (
			<div className='row justify-content-center m h-100'>
				<div className='col align-self-center'>
					{image && <img className='mb-3' alt={text} src={image}></img>}
					<p>{text}</p>
				</div>
			</div>
		);
	}

}

class Feed extends React.Component<{app: App},{posts: PostProps[], loadingProcess: number, loading: boolean}> {

	total = 5;

	constructor(props: any) {
		super(props);
		this.state = {posts: [], loadingProcess: 0, loading: false};
	}

	fetchPosts(count = 12) {
		this.setState({ loading: true, loadingProcess: 0 })

		fetch(`/posts?count=${count}`)
			.then(res => res.json())
			.then(loaded => {

				const posts = [...this.state.posts, ...loaded];
				this.setState({ posts, loading: false });

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
		let { loadingProcess } = this.state;
		loadingProcess++;

		if(e.deltaY > 0) {
			const scroll = e.currentTarget.scrollHeight - e.currentTarget.scrollTop;
			const height = e.currentTarget.getBoundingClientRect().height;
			if(scroll - height < 10) {
				if(loadingProcess > this.total)
					this.fetchPosts();
				else
					this.setState({ loadingProcess });
			}
		}
	}

	render() {
		const { posts, loadingProcess, loading } = this.state;
		const { app } = this.props;
		const showLoading = loadingProcess > 0 || loading;

		return (
			<div className='feed col-5' onWheel={e => this.scroll(e)}>
				{posts.map((post, i) => <Post key={i} post={post} app={app} />)}

				{false && <button className='fetch' onClick={() => this.fetchPosts()}>Load More</button>}
				<div className={`loading ${showLoading ? '' : 'hidden'} ${loading ? 'process' : ''}`}></div>
			</div>
		);
	}

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

class Profile extends React.Component<{user: User},{}> {

	render() {
		const { user } = this.props;

		return (
			<>
				<h1>Profile</h1>
				<p>{user.username}</p>
			</>
		);
	}

}

class Settings extends React.Component<{options: Options},{}> {

	registerService(service: string) {
		fetch(`/register/${service}`)
			.then(res => res.json())
			.then(json => {
				if(json.uri) window.open(json.uri, '_blank');
			});
	}

	render() {
		const { options } : any = this.props;

		const services = ['reddit'];

		return (
			<>
				<h1>Settings</h1>
				{Object.keys(options).filter(k => typeof options[k] === 'boolean').map(k => <p key={k}>{k}: {options[k]}</p>)}
				{services.map(service =>
					<button className={`service ${service}`} onClick={() => this.registerService(service)} key={service}>{service}</button>
				)}
			</>
		);
	}

}
type Screen = JSX.Element;

interface Screens {
	[key: string]: {icon?: string, screen: Screen};
};

class Sidebar extends React.Component<{screen?: string, screens: Screens, app: App},{}> {

	constructor(props: any) {
		super(props);
		this.state = {};
	}

	render() {
		const { screen, screens, app } = this.props;

		const buttons: Screens = {};
		Object.keys(screens).forEach(k => { if(screens[k].icon) buttons[k] = screens[k] });

		return (
			<div className='sidebar col row'>
				<SidebarButtons screens={buttons} minimized={screen !== undefined} sidebar={app} />
				{Object.keys(screens).map((k, i) => <div id={k} key={k} className={`screen ${screen == k ? '' : 'hidden'}`}>{screens[k].screen}</div>)}
			</div>
		);
	}

}

class SidebarButtons extends React.Component<{sidebar: App, minimized: boolean, screens: Screens},{}> {

	render() {
		const { sidebar, minimized, screens } = this.props;

		return (
			<div onClick={() => { if(minimized) sidebar.select(); }} className={`buttons ${minimized ? 'minimized' : ''}`}>
				{Object.keys(screens).map((k, i) => <button onClick={() => sidebar.select(k)} key={k} >{screens[k].icon}</button>)}
			</div>
		);
	}

}

class App extends React.Component<{},{user?: User, screen?: string, post?: PostProps}> {

	constructor(props: any) {
		super(props);
		this.state = {};
	}

	select(screen?: string) {
		this.setState({ screen });
	}

	selectPost(post: PostProps) {
		this.setState({ post });
		this.select(post.id);
	}

	getUser() {
		fetch('/user')
			.then(res => res.json())
			.then(user => this.setState({ user }));
	}

	componentDidMount() {
		this.getUser();
	}

	render() {
		const { user, post, screen } = this.state;

		const screens: any = {};

		if(user) {
			screens.options = {icon: '⚙', screen: <Settings options={user.options} />};
			screens.profile = {icon: '🧙‍♂️', screen: <Profile user={user} />};
		}

		screens.yas = {icon: '💯', screen: <h1>Yas</h1>};
		screens.lit = {icon: '🔥', screen: <h1>Lit</h1>};
		screens[post ? post.id : 42] = {screen: (post ? <BigPost post={post} /> : null)}

		if(user)
			return (
				<div className={`app row m-0 ${user.options.dark ? 'dark' : ''}`}>
					<Feed app={this} />
					<Sidebar app={this} screens={screens} screen={screen} />
				</div>
			);

		return <h1>Log in you moron</h1>
	}
}

export default App;
