/**
 * 分镜图工作流组件
 */
import React from 'react';
import BaseWorkflow from '../core/BaseWorkflow';

const StoryboardWorkflow: React.FC = () => {
  return <BaseWorkflow workflowId="storyboard" backPath="/workflow-projects" />;
};

export default StoryboardWorkflow;
