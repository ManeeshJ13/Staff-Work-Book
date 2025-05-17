import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import SignIn from './pages/SignIn';
import DataEntry from './pages/DataEntry';
import AdminDashboard from './pages/AdminDashboard';
import DailySummary from './pages/admin/DailySummary';
import AddClientPage from './pages/admin/ClientManagement/AddClientPage';
import AddStaff from './pages/admin/StaffManagement/AddStaff';
import StaffDashboard from './pages/StaffDashboard';
import DataEdit from './pages/DataEdit'
import AddAssignment from './pages/admin/AddAssignment';
import StaffReport from './pages/admin/StaffReport';
import AssignmentReport from './pages/admin/AssignmentReport';
import ClientManagement from './pages/admin/ClientManagement';
import StaffManagement from './pages/admin/StaffManagement';
import AssignmentManagement from './pages/admin/AssignmentManagement';
import DeleteStaff from './pages/admin/StaffManagement/DeleteStaff';
import EditStaff from './pages/admin/StaffManagement/EditStaff';

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
        <Route path="/admin/ClientManagement/AddClientPage" element={<AddClientPage/>}/>
        <Route path="/admin/StaffManagement/AddStaff" element={<AddStaff/>}/>"
        <Route path="/admin/StaffManagement/DeleteStaff" element={<DeleteStaff/>}/>"
        <Route path="/admin/StaffManagement/EditStaff" element={<EditStaff/>}/>"
        <Route path="/admin/AddAssignment" element={<AddAssignment/>}/>"
        <Route path="/admin/StaffReport" element={<StaffReport/>}/>"
        <Route path="/admin/AssignmentReport" element={<AssignmentReport/>}/>"
        <Route path="/admin/ClientManagement" element={<ClientManagement/>}/>"
        <Route path="/admin/StaffManagement" element={<StaffManagement/>}/>"
        <Route path="/admin/AssignmentManagement" element={<AssignmentManagement/>}/>"
      </Routes>
    </BrowserRouter>
  );
}

export default App;