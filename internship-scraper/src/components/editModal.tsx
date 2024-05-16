import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { FaEdit } from "react-icons/fa";
import { supabaseBrowser } from '@/lib/supabase/browser';
import useUser from '@/app/hook/useUser';
import useSharedFormState from '@/app/hook/useCustomJobPosts';

const supabase = supabaseBrowser();

const EditForm: React.FC<{ jobPost: any }> = ({ jobPost }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { isFetching, data } = useUser();
  const { customJobPosts, setCustomJobPosts } = useSharedFormState();

  const [formData, setFormData] = useState({
    jobLink: jobPost.job_link || '',
    jobRole: jobPost.job_role || '',
    companyName: jobPost.company_name || '',
    location: jobPost.location || '',
    status: jobPost.status || '',
  });

  const openModal = () => {
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  const handleChange = (e:any) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e:any) => {
    e.preventDefault();
    console.log(jobPost);
    if (data) {
      const currentDate = new Date();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      const year = currentDate.getFullYear();
      try {
        const { data: updateData, error } = await supabase
        .from('custom_applications')
        .update({
            job_link: formData.jobLink,
            job_role: formData.jobRole,
            company_name: formData.companyName,
            location: formData.location,
        })
        .eq('job_link', jobPost.job_link)
        .eq('user', jobPost.user)
        .select()
        .single();

        if (error) {
          throw error;
        }

        console.log(updateData);

        setCustomJobPosts(customJobPosts.map(post => {
        if (post.job_link === jobPost.job_link && post.user === jobPost.user) {
            return {
            ...post,
            job_link: updateData.job_link,
            job_role: updateData.job_role,
            company_name: updateData.company_name,
            location: updateData.location,
            };
        }
        return post;
        }));
        

        // setCustomJobPosts(updatedCustomJobPosts);

      } catch (error:any) {
        console.error('Error upserting application data:', error.message);
      }
    }
    closeModal();
  };

  return (
    <div>
      {data && (<button onClick={openModal} className="justify-center items-center flex text-white font-bold py-6 px-2 rounded-full rounded"><FaEdit color="gray" /></button>)}
      <Modal
        isOpen={isOpen}
        onRequestClose={closeModal}
        contentLabel="Custom Application Entry"
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
        <h2 className="text-xl font-bold mb-4">Edit Application</h2>
        <form onSubmit={handleSubmit}>
          <label className="block mb-4">
            Job Link
            <input
              name="jobLink"
              type="text"
              placeholder="Job Link"
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-2 py-1 mt-1 text-gray-300 bg-gray-600"
              value={formData.jobLink}
              onChange={handleChange}
              required
            />
          </label>
          <label className="block mb-4">
            Job Role
            <input
              name='jobRole'
              type="text"
              placeholder="Job Role"
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-2 py-1 mt-1 text-gray-300 bg-gray-600"
              value={formData.jobRole}
              onChange={handleChange}
              required
            />
          </label>
          <label className="block mb-4">
            Company Name
            <input
              name="companyName"
              type="text"
              placeholder="Company Name"
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-2 py-1 mt-1 text-gray-300 bg-gray-600"
              value={formData.companyName}
              onChange={handleChange}
              required
            />
          </label>
          <label className="block mb-4">
            Location
            <input
              name="location"
              type="text"
              placeholder="Location"
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-2 py-1 mt-1 text-gray-300 bg-gray-600"
              value={formData.location}
              onChange={handleChange}
              required
            />
          </label>
          {/* <label className="block mb-4">
            <select
              name="status"
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-2 py-1 mt-1 text-gray-300 bg-gray-600"
              value={formData.status}
              onChange={handleChange}
              required
            >
              <option value="" disabled>Select a status</option>
              <option value="Not Applied">Not Applied</option>
              <option value="Applied">Applied</option>
              <option value="OA Received">OA Received</option>
              <option value="Interview Scheduled">Interview Scheduled</option>
              <option value="Waitlisted">Waitlisted</option>
              <option value="Rejected">Rejected</option>
              <option value="Offer Received">Offer Received</option>
              <option value="Accepted">Accepted</option>
            </select>
          </label> */}

          <div className="flex justify-end">
            <button
              type="submit"
              className="border- border-green-600 border-2 border-solid hover:bg-green-600 text-gray-300 font-bold py-1 px-2 mr-2 rounded-lg text-sm font-semibold"
            >
              Submit
            </button>
            <button
              onClick={closeModal}
              className="border- border-gray-600 border-2 border-solid hover:bg-gray-600 text-gray-100 font-bold py-1 px-3 rounded-lg text-sm font-semibold"
            >
              Close
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default EditForm;
