/**
 * 角色资源工作流组件
 */
import React from 'react';
import BaseWorkflow from '../core/BaseWorkflow';

const CharacterResourceWorkflow: React.FC = () => {
  return <BaseWorkflow workflowId="character-resource" backPath="/workflow-projects" />;
};

export default CharacterResourceWorkflow;
