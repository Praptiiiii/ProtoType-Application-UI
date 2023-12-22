/* eslint-disable no-unused-vars */
import './App.css'
import Table from './components/Table'
import 'handsontable/dist/handsontable.full.min.css';
import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';


function App() {
  registerAllModules();
  return (
    <Table />
  );
}

export default App
