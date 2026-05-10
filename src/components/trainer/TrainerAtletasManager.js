// src/components/trainer/TrainerAtletasManager.js
import React from 'react';
import PropTypes from 'prop-types';
import AtletasManager from '../admin/AtletasManager';

const TrainerAtletasManager = ({ user }) => {
  return <AtletasManager user={user} />;
};

TrainerAtletasManager.propTypes = {
  user: PropTypes.object.isRequired
};

export default TrainerAtletasManager;

