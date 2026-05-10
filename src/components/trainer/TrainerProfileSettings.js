// src/components/trainer/TrainerProfileSettings.js
import React from 'react';
import PropTypes from 'prop-types';
import ProfileSettings from '../admin/ProfileSettings';

const TrainerProfileSettings = ({ user }) => {
  return <ProfileSettings user={user} />;
};

TrainerProfileSettings.propTypes = {
  user: PropTypes.object.isRequired
};

export default TrainerProfileSettings;
