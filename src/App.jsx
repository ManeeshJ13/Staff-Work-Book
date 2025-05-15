import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import SignIn from './pages/SignIn';
import DataEntry from './pages/DataEntry';
import AdminDashboard from './pages/AdminDashboard';
import DailySummary from './pages/admin/DailySummary';
import AddClientPage from './pages/admin/AddClientPage';
import AddStaff from './pages/admin/AddStaff';
import StaffDashboard from './pages/StaffDashboard';
import DataEdit from './pages/DataEdit';
import AddAssignment from './pages/admin/AddAssignment';
import StaffReport from './pages/admin/StaffReport';
import AssignmentReport from './pages/admin/AssignmentReport';

//added to do something to vercel cache
const App=()=> {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/signin" element={<SignIn/>}/>
        <Route path="/dataentry" element={<DataEntry/>}/>
        <Route path="/staffdashboard" element={<StaffDashboard/>}/>
        <Route path="/dataedit" element={<DataEdit/>}/>
        <Route path="/admindash" element={<AdminDashboard/>}/>
        <Route path="/admin/DailySummary" element={<DailySummary/>}/>
        <Route path="/admin/AddClientPage" element={<AddClientPage/>}/>
        <Route path="/admin/AddStaff" element={<AddStaff/>}/>"
        <Route path="/admin/AddAssignment" element={<AddAssignment/>}/>"
        <Route path="/admin/StaffReport" element={<StaffReport/>}/>"
        <Route path="/admin/AssignmentReport" element={<AssignmentReport/>}/>"
      </Routes>
    </BrowserRouter>
  );
}

export default App;