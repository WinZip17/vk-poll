import React from 'react';
import {Panel, PanelHeader} from '@vkontakte/vkui';
import Spinner from "@vkontakte/vkui/dist/components/Spinner/Spinner";
import PropTypes from 'prop-types';


const Spiner = props => (
	<Panel id={props.id}>
		<PanelHeader>Найти потеряшку</PanelHeader>
		<div style={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
			<Spinner size="large" style={{ marginTop: 20 }} />
		</div>
	</Panel>
);

Spiner.propTypes = {
	id: PropTypes.string.isRequired,
	go: PropTypes.func.isRequired,
};

export default Spiner;
