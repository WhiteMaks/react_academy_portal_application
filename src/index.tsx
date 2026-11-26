import React from 'react';
import ReactDOM from 'react-dom/client';
import {Provider} from "react-redux";
import {createBrowserRouter, RouterProvider} from "react-router-dom";
import Application from './web/Application';
import {initGlobalStore} from "./data/state/store";

import './index.css';
import './admin-kit.css';

const root = ReactDOM.createRoot(
	document.getElementById('root') as HTMLElement
);

const globalStore = initGlobalStore();
const router = createBrowserRouter([{path: "*", element: <Application/>}]);

root.render(
	<React.StrictMode>
		<Provider store={globalStore}>
			<RouterProvider router={router}/>
		</Provider>
	</React.StrictMode>
);
