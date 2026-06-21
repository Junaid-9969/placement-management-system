import React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { studentAPI } from "../../api";

export default function StudentDetails() {
  const { id } = useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["student-details", id],
    queryFn: () =>
      studentAPI.getById(id).then(res => res.data.data)
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const student = data;
  

  return (
    <div className="space-y-6">
      <div className="card p-6">

        <h1 className="text-2xl font-bold">
          {student.firstName} {student.lastName}
        </h1>

        <p>Branch: {student.branch}</p>
        <p>CGPA: {student.cgpa}</p>

        <p>Email: {student.user?.email}</p>

        <hr className="my-4" />
        
        <h2 className="font-semibold mb-2">
  Documents & Links
</h2>


<div className="space-y-2 mb-4">

<div className="flex flex-wrap gap-3">
  {student.resumeUrl && (
    <a
      href={`http://localhost:5000${student.resumeUrl}`}
      target="_blank"
      rel="noreferrer"
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
    >
      📄 View Resume
    </a>
  )}

  {student.githubUrl && (
    <a
      href={student.githubUrl}
      target="_blank"
      rel="noreferrer"
      className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 text-sm"
    >
      🔗 GitHub
    </a>
  )}

  {student.linkedinUrl && (
    <a
      href={student.linkedinUrl}
      target="_blank"
      rel="noreferrer"
      className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 text-sm"
    >
      💼 LinkedIn
    </a>
  )}

  {student.portfolioUrl && (
    <a
      href={student.portfolioUrl}
      target="_blank"
      rel="noreferrer"
      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
    >
      🌐 Portfolio
    </a>
  )}
</div>

</div>

<hr className="my-4" />

        <h2 className="font-semibold mb-2">
          Skills
        </h2>

        <div className="flex flex-wrap gap-2">
          {student.skills?.map(skill => (
            <span
              key={skill}
              className="px-3 py-1 bg-blue-100 rounded-full text-sm"
            >
              {skill}
            </span>
          ))}
        </div>

        <hr className="my-4" />

        <h2 className="font-semibold mb-2">
          Projects
        </h2>

        {student.projects?.map((project, index) => (
          <div
            key={index}
            className="border rounded-lg p-3 mb-3"
          >
            <h3 className="font-semibold">
              {project.title}
            </h3>

            <p>
              {project.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}