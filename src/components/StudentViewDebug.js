// src/components/StudentViewDebug.js
import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

const StudentViewDebug = ({ user }) => {
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    if (user?.id) {
      debugStudentAccess();
    }
  }, [user]);

  const debugStudentAccess = async () => {
    console.log('🔍 === DEBUG STUDENT ACCESS ===');
    console.log('👤 User object:', user);
    console.log('🆔 User ID:', user?.id);
    console.log('📧 User Email:', user?.email);

    try {
      // Verificar si existe en la tabla students
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select(`
          id,
          categoria,
          user_id,
          users(
            id,
            nombre,
            apellido,
            email,
            telefono,
            role
          )
        `)
        .eq('user_id', user.id);

      console.log('📋 Students query result:', { studentData, studentError });

      // Verificar si existe en la tabla users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id);

      console.log('👥 Users query result:', { userData, userError });

      // Verificar todos los students para debug
      const { data: allStudents, error: allStudentsError } = await supabase
        .from('students')
        .select(`
          id,
          categoria,
          user_id,
          users(
            id,
            nombre,
            apellido,
            email,
            role
          )
        `);

      console.log('🎓 All students:', { allStudents, allStudentsError });

      setDebugInfo({
        userObject: user,
        studentData,
        studentError,
        userData,
        userError,
        allStudents,
        allStudentsError
      });

    } catch (error) {
      console.error('❌ Debug error:', error);
      setDebugInfo({ error: error.message });
    }
  };

  if (!user) {
    return (
      <div style={{ padding: '20px', backgroundColor: '#f8f9fa', margin: '20px', borderRadius: '10px' }}>
        <h2>🐛 Student Debug - No User</h2>
        <p>No user object received</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', backgroundColor: '#f8f9fa', margin: '20px', borderRadius: '10px' }}>
      <h2>🐛 Student Access Debug</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>👤 User Info</h3>
        <p><strong>ID:</strong> {user?.id}</p>
        <p><strong>Email:</strong> {user?.email}</p>
        <p><strong>Role:</strong> {user?.role || 'Not set'}</p>
      </div>

      {debugInfo.studentData && (
        <div style={{ marginBottom: '20px' }}>
          <h3>🎓 Student Data</h3>
          <pre style={{ background: '#fff', padding: '10px', borderRadius: '5px', overflow: 'auto' }}>
            {JSON.stringify(debugInfo.studentData, null, 2)}
          </pre>
        </div>
      )}

      {debugInfo.studentError && (
        <div style={{ marginBottom: '20px' }}>
          <h3>❌ Student Error</h3>
          <pre style={{ background: '#ffebee', padding: '10px', borderRadius: '5px', color: '#c62828' }}>
            {JSON.stringify(debugInfo.studentError, null, 2)}
          </pre>
        </div>
      )}

      {debugInfo.userData && (
        <div style={{ marginBottom: '20px' }}>
          <h3>👥 User Data in Users Table</h3>
          <pre style={{ background: '#fff', padding: '10px', borderRadius: '5px', overflow: 'auto' }}>
            {JSON.stringify(debugInfo.userData, null, 2)}
          </pre>
        </div>
      )}

      {debugInfo.allStudents && (
        <div style={{ marginBottom: '20px' }}>
          <h3>📚 All Students (Debug)</h3>
          <pre style={{ background: '#fff', padding: '10px', borderRadius: '5px', overflow: 'auto', maxHeight: '300px' }}>
            {JSON.stringify(debugInfo.allStudents, null, 2)}
          </pre>
        </div>
      )}

      <button 
        onClick={debugStudentAccess}
        style={{ 
          padding: '10px 20px', 
          backgroundColor: '#007bff', 
          color: 'white', 
          border: 'none', 
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        🔄 Re-run Debug
      </button>
    </div>
  );
};

export default StudentViewDebug;