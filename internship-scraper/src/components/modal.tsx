import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { FaPlus } from "react-icons/fa";
import { supabaseBrowser } from '@/lib/supabase/browser';
import useUser from '@/app/hook/useUser';
import useSharedFormState from '@/app/hook/useCustomJobPosts';

const supabase = supabaseBrowser();

const Form = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isFetching, data } = useUser();
  const {customJobPosts, setCustomJobPosts} = useSharedFormState();

  const openModal = () => {
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  const handleSubmit = async (e:any) => {
    e.preventDefault();
    if(data){
        const formData = new FormData(e.target);
        const currentDate = new Date();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        const year = currentDate.getFullYear();
        try {
            const { data: insertData, error } = await supabase
                .from('custom_applications')
                .upsert({
                    job_link: String(formData.get('jobLink')),
                    user: data.id,
                    job_role: String(formData.get('jobRole')),
                    company_name: String(formData.get('companyName')),
                    location: String(formData.get('location')),
                    status: String(formData.get('status')),
                    date: `${month}-${day}-${year}`
                }).select();
            if (error) {
                throw error;
            }

            setCustomJobPosts([...customJobPosts, ...insertData]);

        } catch (error) {
            console.error('Error upserting application data:', error.message);
        }
        
    }
    closeModal();
  };

  return (
    <div>
      {data && (<button onClick={openModal} className="justify-center items-center flex border border-solid border-2 border-red-600 hover:bg-red-600 text-white font-bold py-1 px-1 rounded-full rounded"><FaPlus /></button>)}
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
        <h2 className="text-xl font-bold mb-4">Custom Application Entry</h2>
        <form onSubmit={handleSubmit}>
            <label className="block mb-4">
            <input
                name="jobLink"
                type="text"
                placeholder="Job Link"
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-2 py-1 mt-1 text-gray-300 bg-gray-600"
                required
            />
            </label>
            <label className="block mb-4">
            <input
                name='jobRole'
                type="text"
                placeholder="Job Role"
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-2 py-1 mt-1 text-gray-300 bg-gray-600"
                required
            />
            </label>
            <label className="block mb-4">
            <input
                name="companyName"
                type="text"
                placeholder="Company Name"
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-2 py-1 mt-1 text-gray-300 bg-gray-600"
                required
            />
            </label>
            <label className="block mb-4">
            <input
                name="location"
                type="text"
                placeholder="Location"
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-2 py-1 mt-1 text-gray-300 bg-gray-600"
                required
            />
            </label>
            <label className="block mb-4">
                <select
                    name="status"
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-2 py-1 mt-1 text-gray-300 bg-gray-600"
                    required
                >
                    <option value="" disabled selected>Select a status</option>
                    <option value="Not Applied">Not Applied</option>
                    <option value="Applied">Applied</option>
                    <option value="OA Recieved">OA Received</option>
                    <option value="Interview Scheduled">Interview Scheduled</option>
                    <option value="Waitlisted">Waitlisted</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Offer Received">Offer Received</option>
                    <option value="Accepted">Accepted</option>
                </select>
            </label>

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

export default Form;