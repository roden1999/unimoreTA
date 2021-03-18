const router = require("express").Router();
const bcrypt = require("bcryptjs");
const verify = require("../utils/verifyToken");
const salaryModel = require("../models/salary");
const employeeModel = require("../models/employees");
const departmentModel = require("../models/department");
const fs = require('fs');
const { salaryValidation } = require("../utils/validation");

//Insert new department to the database
router.post("/", async (request, response) => {
    //Validate before creating
    const { error } = salaryValidation(request.body);
    if (error) return response.status(400).send(error.details[0].message);

    //Check if department exist
    const deptExist = await salaryModel.findOne({
        employeeId: request.body.employeeId,
    });
    if (deptExist)
        return response.status(400).json({ message: "Employee already have a salary." });

    //Create new user
    const newSalary = new salaryModel({
        employeeId: request.body.employeeId,
        salary: request.body.salary,
        sss: request.body.sss,
        phic: request.body.phic,
        hdmf: request.body.hdmf,
        sssLoan: request.body.sssLoan,
        pagibigLoan: request.body.pagibigLoan,
        careHealthPlus: request.body.careHealthPlus
    });
    try {
        const salary = await newSalary.save();
        response.status(200).json({ salary: "Salary successfully saved." });
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
});

router.put("/:id", async (request, response) => {
    try {
        //Validate before editing
        const { error } = salaryValidation(request.body);
        if (error) return response.status(400).send(error.details[0].message);

        // const salary = await salaryModel.findById(request.params.id);
        const salary = await salaryModel.find({ employeeId: request.params.id });
        const updates = request.body;
        const options = { new: true };
        const updatedDept = await salaryModel.findByIdAndUpdate(
            salary,
            updates,
            options
        );
        response.status(200).json(updatedDept);
    } catch (error) {
        response.status(500).json({ error: "Error" });
    }
});

//List of Department
router.post("/list", async (request, response) => {
    try {
        var page = request.body.page !== "" ? request.body.page : 0;
        var perPage = 10;
        if (Object.keys(request.body.selectedEmployee).length > 0) {
            var id = [];
            var data = request.body.selectedEmployee;
            for (const i in data) {
                id.push({ _id: data[i].value });
            }
            const emp = await employeeModel.find({
                '$or': id,
            }).skip((page - 1) * perPage).limit(perPage).sort("firstName");

            var employees = [];
            for (const i in emp) {
                const salary = await salaryModel.findOne({
                    employeeId: emp[i]._id,
                });

                const dept = await departmentModel.findById(emp[i].department);

                /* var salaryAndDeduction = {
                    "salary": !salary ? 0 : salary.salary,
                    "sss": !salary ? 0 : salary.sss,
                    "phic": !salary ? 0 : salary.phic,
                    "hdmf": !salary ? 0 : salary.hdmf,
                    "sssLoan": !salary ? 0 : salary.sssLoan,
                    "pagibigLoan": !salary ? 0 : salary.pagibigLoan,
                    "careHealthPlus": !salary ? 0 : salary.careHealthPlus
                } */

                var employeeData = {
                    "_id": emp[i]._id,
                    "employeeNo": emp[i].employeeNo,
                    "employeeName": emp[i].firstName + " " + emp[i].middleName + " " + emp[i].lastName,
                    "department": !dept.department ? "" : dept.department,
                    // "salaryAndDeductions": [salaryAndDeduction]
                    "salary": !salary ? 0 : salary.salary,
                    "sss": !salary ? 0 : salary.sss,
                    "phic": !salary ? 0 : salary.phic,
                    "hdmf": !salary ? 0 : salary.hdmf,
                    "sssLoan": !salary ? 0 : salary.sssLoan,
                    "pagibigLoan": !salary ? 0 : salary.pagibigLoan,
                    "careHealthPlus": !salary ? 0 : salary.careHealthPlus
                }

                employees.push(employeeData);
            }
            response.status(200).json(employees);
        } else {
            const emp = await employeeModel.find().sort('firstName');

            var employees = [];
            for (const i in emp) {
                const salary = await salaryModel.findOne({
                    employeeId: emp[i]._id,
                });

                const dept = await departmentModel.findById(emp[i].department);

                /* var salaryAndDeduction = {
                    "salary": !salary ? 0 : salary.salary,
                    "sss": !salary ? 0 : salary.sss,
                    "phic": !salary ? 0 : salary.phic,
                    "hdmf": !salary ? 0 : salary.hdmf,
                    "sssLoan": !salary ? 0 : salary.sssLoan,
                    "pagibigLoan": !salary ? 0 : salary.pagibigLoan,
                    "careHealthPlus": !salary ? 0 : salary.careHealthPlus
                } */

                var employeeData = {
                    "_id": emp[i]._id,
                    "employeeNo": emp[i].employeeNo,
                    "employeeName": emp[i].firstName + " " + emp[i].middleName + " " + emp[i].lastName,
                    "department": dept.department,
                    // "salaryAndDeductions": [salaryAndDeduction]
                    "salary": !salary ? 0 : salary.salary,
                    "sss": !salary ? 0 : salary.sss,
                    "phic": !salary ? 0 : salary.phic,
                    "hdmf": !salary ? 0 : salary.hdmf,
                    "sssLoan": !salary ? 0 : salary.sssLoan,
                    "pagibigLoan": !salary ? 0 : salary.pagibigLoan,
                    "careHealthPlus": !salary ? 0 : salary.careHealthPlus
                }

                employees.push(employeeData);
            }
            response.status(200).json(employees);
        }
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
});

//For search options
router.get("/options", async (request, response) => {
    try {
        const employees = await employeeModel.find().sort('firstName');
        response.status(200).json(employees);
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
});

//Delete department from the database based on id
router.delete("/:id", async (request, response) => {
    try {
        const dept = await departmentModel.findById(request.params.id);
        const deletedDept = await dept.delete();
        response.status(200).json(deletedDept);
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
});

module.exports = router;    