import React, {FC} from "react";
import NavigationPanel from "../component/navigation_panel/NavigationPanel";
import ContentPanel from "../component/content_panel/ContentPanel";
import Block from "../component/common/block/Block";
import {Outlet} from "react-router-dom";

const HomePage: FC = () => (
	<Block className="home_page">
		<NavigationPanel/>
		<ContentPanel>
			<Outlet/>
		</ContentPanel>
	</Block>
);

export default HomePage;
