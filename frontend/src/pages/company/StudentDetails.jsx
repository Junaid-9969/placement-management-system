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