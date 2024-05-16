import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { MdDeleteForever } from "react-icons/md";
import { supabaseBrowser } from '@/lib/supabase/browser';
import useUser from '@/app/hook/useUser';
import useSharedFormState from '@/app/hook/useCustomJobPosts';

const supabase = supabaseBrowser();

const DeleteForm: React.FC<{ jobPost: any }> = ({ jobPost }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { isFetching, data } = useUser();
  const { customJobPosts, setCustomJobPosts } = useSharedFormState();

  const openModal = () => {
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  const handleDelete = async () => {
    try {
      // Perform the deletion operation
      await supabase
        .from('custom_applications')
        .delete()
        .eq('job_link', jobPost.job_link)
        .eq('user', jobPost.user);

      setCustomJobPosts(customJobPosts.filter(post => !(post.job_link === jobPost.job_link && post.user === jobPost.user)));

      // Close the modal
      closeModal();
    } catch (error:any) {
      console.error('Error deleting application data:', error.message);
    }
  };

  return (
    <div>
      {data && (<button onClick={openModal} className="justify-center items-center flex text-white font-bold py-6 px-2 rounded-full rounded"><MdDeleteForever color="gray" /></button>)}
      <Modal
        isOpen={isOpen}
        onRequestClose={closeModal}
        contentLabel="Delete Confirmation"
        ariaHideApp={false}
        className="bg-gray-900"
        style={{
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          },
          content: {
            width: '90%', // Set width
            maxWidth: '600px', // Set maximum width
            padding: '20px', // Add padding
          },
        }}
      >
        <h2 className="text-xl font-bold mb-4">Confirm Deletion</h2>
        <p>Are you sure you want to delete this job post?</p>
        <div className="flex justify-end mt-4">
          <button
            onClick={handleDelete}
            className="border border-red-600 border-2 border-solid hover:bg-red-600 text-gray-100 font-bold py-1 px-3 rounded-lg text-sm font-semibold"
          >
            Delete
          </button>
          <button
            onClick={closeModal}
            className="border border-gray-600 border-2 border-solid hover:bg-gray-600 text-gray-100 font-bold py-1 px-3 rounded-lg text-sm font-semibold ml-2"
          >
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default DeleteForm;