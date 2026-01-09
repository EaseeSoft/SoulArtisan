import React from 'react';
import {Route, Routes} from 'react-router-dom';
import {Toaster} from 'react-hot-toast';
import {AuthProvider} from './contexts/AuthContext';
import {SiteConfigProvider} from './contexts/SiteConfigContext';
import Home from './components/home/Home';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/dashboard/Dashboard';
import Sora2Workflow from './components/dashboard/Sora2Workflow';
import ProjectManager from './components/dashboard/ProjectManager';
import ScriptManager from './components/dashboard/ScriptManager';
import ScriptDetail from './components/dashboard/ScriptDetail';
import ImageGeneratorPage from './components/pages/ImageGeneratorPage';
import VideoGeneratorPage from './components/pages/VideoGeneratorPage';
import MediaReversePage from './components/pages/MediaReversePage';
import StoryboardCutPage from './components/pages/StoryboardCut';
import CharacterProjectList from './components/pages/CharacterProjectList';
import CharacterProjectDetail from './components/pages/CharacterProjectDetail';
import AccountSettingsPage from './components/pages/AccountSettingsPage';
import './App.css';

function App() {
  return (
    <SiteConfigProvider>
      <AuthProvider>
        <div className="App">
          {/* Toast 消息提示容器 */}
          <Toaster />

          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />

            {/* 工作流项目管理 */}
            <Route path="/workflow-projects" element={<ProjectManager />} />

            {/* 剧本管理 */}
            <Route path="/scripts" element={<ScriptManager />} />
            <Route path="/scripts/:scriptId" element={<ScriptDetail />} />

            {/* 工作流编辑器 */}
            <Route path="/workflow" element={<Sora2Workflow />} />
            <Route path="/sora2-workflow" element={<Sora2Workflow />} />

            {/* 图像生成 */}
            <Route path="/image-generator" element={<ImageGeneratorPage/>}/>

            {/* 视频生成 */}
            <Route path="/video-generator" element={<VideoGeneratorPage/>}/>

            {/* 媒体反推 */}
            <Route path="/media-reverse" element={<MediaReversePage/>}/>

            {/* 分镜处理 */}
            <Route path="/storyboard-cut" element={<StoryboardCutPage/>}/>

            {/* 角色项目 */}
            <Route path="/character-projects" element={<CharacterProjectList/>}/>
            <Route path="/character-projects/:projectId" element={<CharacterProjectDetail/>}/>

            {/* 账户设置 */}
            <Route path="/account-settings" element={<AccountSettingsPage/>}/>
          </Routes>
        </div>
      </AuthProvider>
    </SiteConfigProvider>
  );
}

export default App;