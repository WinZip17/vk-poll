import React from 'react';
import connect from '@vkontakte/vk-connect';
import {View} from '@vkontakte/vkui';
import '@vkontakte/vkui/dist/vkui.css';
import Home from './panels/Home';
import "./App.css"
import Spiner from "./panels/Spiner";
import AddPostEnd from "./panels/AddPostEnd";

//личный токен админа группы
const token = "8562720b7714ff2af73756a192b2b17d934eff7232f8e4110d614ba8277416eab25f57e933f84f7fa404b";

//id альбома для загрузки фотографий
const album_id = "269063524";

//id группы с которой работаем
const group_id = "186665203";

//картинка по умлочанию должна находиться уже в альбоме группы, при открытии фотки данные можно взять со строки адреса в формате как приведенно ниже
const defaultPhoto = "photo-186665203_457239019";



//получение ссылки на загрузку фотки
const postPhotoUrl = () => {
	connect.send("VKWebAppCallAPIMethod", {"method": "photos.getUploadServer", "request_id": "photoUrl", "params": {"album_id": album_id, "group_id": group_id,
			"v":"5.101", "access_token": token}});
}

const postPhoto = (url, photo) => {
	let formData = new FormData();
	formData.append('photo', photo);
	const proxyurl = "https://cors-anywhere.herokuapp.com/";
	fetch(proxyurl+url, {
		method: 'POST',
		body: formData,
		headers: {
			'Access-Control-Allow-Origin': '*'
		},
	})
		.then(function (response) {
			return response.json();
		})
		.then(function (data) {
			if (data) {
				debugger
				savePhoto(data.server, data.photos_list, data.hash);
			} else {
				// proccess server errors
			}
		})
		.catch(function (error) {
			// proccess network errors
		});
};

const savePhoto = (server, photos_list, hash) => {
	connect.send("VKWebAppCallAPIMethod", {"method": "photos.save", "request_id": "photoSave", "params": {"album_id": album_id, "group_id": group_id,
			"server": server, "photos_list": photos_list, "hash": hash, "v":"5.101", "access_token": token}});
};


class App extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			activePanel: 'home',
			fetchedUser: null,
			field1: "",
			field2: "",
			field3: "",
			field4: "",
			img : null,
			imageUrl: null,
			isReady: false,
			male: true,
			imgForMessage: defaultPhoto,
			postSendId: 0,
			poll: ""
		};
	}

	componentDidMount() {
		connect.subscribe((e) => {
			switch (e.detail.type) {
				case 'VKWebAppGetUserInfoResult':
					this.setState({ fetchedUser: e.detail.data });
					if (e.detail.data.sex === 1) {
						this.setState({ male: false });
					}
					break;
				case 'VKWebAppCallAPIMethodResult':
                    switch (e.detail.data.request_id){
                        case 'photoUrl':
                            this.setState({imageUrl: e.detail.data.response.upload_url});
                            postPhoto(e.detail.data.response.upload_url, this.state.img);
                            break;
                        case 'photoSave':
							this.setState({imgForMessage: `photo${e.detail.data.response[0].owner_id}_${e.detail.data.response[0].id}`});
							this.createPoll();
                            break;
                        case 'isCreatePoll':
							this.setState({poll: `poll${e.detail.data.response.owner_id}_${e.detail.data.response.id}`});
							let message = `Ищу ${this.state.field1}. ${this.state.field2} встретились ${this.state.field3}. ${this.state.field4}. ${this.state.male ? "Понравилась" : "Понравился"}, отзовись`;
							let photo = this.state.imgForMessage;
							this.createMessage(message, this.state.poll, photo);
                            break;
                        case 'sendWall':
							this.setState({postSendId: e.detail.data.response.post_id, field1: "",
								field2: "",	field3: "",	field4: "",	img : null, activePanel: "addpost"});
                            break;
                        default:
                            console.log(e);
                    }
                        console.log(e);
					break;
				default:
					console.log(e);
			}
		});
		connect.send('VKWebAppGetUserInfo', {});

	}

	componentDidUpdate() {
		if (this.state.isReady === false && this.state.field1.length > 0 && this.state.field2.length > 0 && this.state.field3.length > 0 && this.state.field4.length > 0) {
			this.setState({isReady: true})
		}
		if (this.state.isReady === true && this.state.field1.length === 0 && this.state.field2.length === 0 && this.state.field3.length === 0 && this.state.field4.length === 0) {
			this.setState({isReady: false})
		}
	}

	go = (e) => {
		this.setState({ activePanel: e.currentTarget.dataset.to })
	};

	createPoll = () => {
		let answers = '["Возможно это я","Пиши, я ее знаю","Посмотреть результаты"]';
		connect.send("VKWebAppCallAPIMethod", {"method": "polls.create", "request_id": "isCreatePoll", "params": {"question": "Хелп", "is_anonymous": "0",
				"is_multiple": "0", "owner_id": "-185650440", "add_answers": answers, "v":"5.101", "access_token": token}});
	};

    createMessage = (message,poll, photo) => {
        let attachments = `${photo}, ${poll}`;
        //сгенерированный guid
        let guid = Math.floor(1000000000 + Math.random() * (9000000000 + 1 - 1000000000));
		// let data = +new Date();
		// let postData = Math.round(data/1000)+86400; "publish_date": +postData,

			connect.send("VKWebAppCallAPIMethod", {"method": "wall.post", "request_id": "sendWall", "params": {"owner_id": `-${group_id}`, "from_group": "1",
                "signed": "0", "message": message, "attachments": attachments, "guid": guid, "v":"5.101", "access_token": token}});
    }

	sendForms = () => {
    	this.setState({ activePanel: "spinner" })
		if (this.state.img === null) {
			this.createPoll();
		} else {
			postPhotoUrl()
		}
	};

	сhangeForms = (e) => {
		switch (e.currentTarget.name) {
			case 'file':
				const file    = e.currentTarget.files[0];
				const reader  = new FileReader();
				reader.onloadend = () => {
					this.setState({
						imageUrl: reader.result
					})
				}
				if (file) {
					reader.readAsDataURL(file);
					this.setState({
						imageUrl :reader.result
					})
				}
				else {
					this.setState({
						imageUrl: ""
					})
				}
				this.setState({img: e.currentTarget.files[0]});
				break;
			default:
				this.setState({[e.currentTarget.name]: e.currentTarget.value});
		}
	};

	render() {
		return (
			<View activePanel={this.state.activePanel}>
				<Home id="home" fetchedUser={this.state.fetchedUser} innquiryInfo={this.state} сhangeForms={this.сhangeForms} go={this.go}
					  sendForms={this.sendForms}/>
				<Spiner id="spinner" fetchedUser={this.state.fetchedUser} innquiryInfo={this.state} go={this.go}/>
				<AddPostEnd id="addpost" fetchedUser={this.state.fetchedUser} innquiryInfo={this.state} go={this.go}/>

			</View>
		);
	}
}




export default App;

