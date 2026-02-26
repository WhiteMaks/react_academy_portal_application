import React from 'react';
import ReactDOM from 'react-dom/client';
import {Provider} from "react-redux";
import {BrowserRouter} from "react-router-dom";
import Application from './web/Application';
import {initGlobalStore} from "./data/state/store";

import './index.css';

const root = ReactDOM.createRoot(
	document.getElementById('root') as HTMLElement
);

const globalStore = initGlobalStore();

root.render(
	<React.StrictMode>
		<Provider store={globalStore}>
			<BrowserRouter>
				<Application/>
			</BrowserRouter>
		</Provider>
	</React.StrictMode>
);
