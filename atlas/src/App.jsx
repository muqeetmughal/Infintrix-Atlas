import { RouterProvider } from "react-router-dom";
import './App.css'
import { FrappeProvider } from 'frappe-react-sdk'
import { router } from "./Routes";
function App() {

	return (
		<div className="App">
			<FrappeProvider
				url={import.meta.env.VITE_FRAPPE_PATH ?? ''}
				socketPort={import.meta.env.VITE_SOCKET_PORT ? import.meta.env.VITE_SOCKET_PORT : undefined}
			>
				<RouterProvider router={router} />
			</FrappeProvider>
		</div>
	)
}

export default App
