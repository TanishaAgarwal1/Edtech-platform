const { uploadImageToCloudinary } = require("../utils/imageUploader")
const User = require("../models/User")
const Course = require("../models/Course")
const Category = require("../models/Category")
const { convertSecondsToDuration } = require("../utils/secToDuration")
const Section = require("../models/Section")
const SubSection = require("../models/SubSection")
const CourseProgress = require("../models/CourseProgress")

exports.createCourse = async (req, res) => {
  try {
    // Get user ID from request object
    const userId = req.user.id

    // Get all required fields from request body
    let {
      courseName,
      courseDescription,
      whatYouWillLearn,
      price,
      
      category,
      status,
     
    } = req.body
    // Get thumbnail image from request files
    const thumbnail = req.files.thumbnailImage

    // // Convert the tag and instructions from stringified Array to Array
    // const tag = JSON.parse(_tag)
    // const instructions = JSON.parse(_instructions)

    // console.log("tag", tag)
    // console.log("instructions", instructions)

    // Check if any of the required fields are missing
    if (
      !courseName ||
      !courseDescription ||
      !whatYouWillLearn ||
      !price ||
     
      !thumbnail ||
      !category 
    ) {
      return res.status(400).json({
        success: false,
        message: "All Fields are Mandatory",
      })
    }
    if (!status || status === undefined) {
      status = "Draft"
    }
    // Check if the user is an instructor
    const instructorDetails = await User.findById(userId, {
      accountType: "Instructor",
    })

    if (!instructorDetails) {
      return res.status(404).json({
        success: false,
        message: "Instructor Details Not Found",
      })
    }

    // Check if the tag given is valid
    const categoryDetails = await Category.findById(category)
    if (!categoryDetails) {
      return res.status(404).json({
        success: false,
        message: "Category Details Not Found",
      })
    }
    // Upload the Thumbnail to Cloudinary
    const thumbnailImage = await uploadImageToCloudinary(
      thumbnail,
      process.env.FOLDER_NAME
    )
    console.log(thumbnailImage)
    // Create a new course with the given details
    const newCourse = await Course.create({
      courseName,
      courseDescription,
      instructor: instructorDetails._id,
      whatYouWillLearn: whatYouWillLearn,
      price,
      
      category: categoryDetails._id,
      thumbnail: thumbnailImage.secure_url,
      status: status,
      
    })

    // Add the new course to the User Schema of the Instructor
    await User.findByIdAndUpdate(
      {
        _id: instructorDetails._id,
      },
      {
        $push: {
          courses: newCourse._id,
        },
      },
      { new: true }
    )
    // Add the new course to the Categories
    const categoryDetails2 = await Category.findByIdAndUpdate(
      { _id: category },
      {
        $push: {
          courses: newCourse._id,
        },
      },
      { new: true }
    )
    console.log("HEREEEEEEEE", categoryDetails2)
    // Return the new course and a success message
    res.status(200).json({
      success: true,
      data: newCourse,
      message: "Course Created Successfully",
    })
  } catch (error) {
    // Handle any errors that occur during the creation of the course
    console.error(error)
    res.status(500).json({
      success: false,
      message: "Failed to create course",
      error: error.message,
    })
  }
}

// exports.createCourse = async (req, res) => {
//   try {
//     // Get user ID from request object
//     const userId = req.user.id;

//     // Destructure request body
//     let {
//       courseName,
//       courseDescription,
//       whatYouWillLearn,
//       price,
//       tag: _tag,
//       category,
//       status,
//       instructions: _instructions,
//     } = req.body;

//     const thumbnail = req.files?.thumbnailImage;

//     // Validate JSON fields
//     let tag, instructions;
//     try {
//       tag = JSON.parse(_tag);
//       instructions = JSON.parse(_instructions);
//     } catch (error) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid JSON format for tag or instructions",
//         error: error.message,
//       });
//     }

//     // Validate required fields
//     if (
//       !courseName ||
//       !courseDescription ||
//       !whatYouWillLearn ||
//       !price ||
//       !Array.isArray(tag) || !tag.length ||
//       !thumbnail ||
//       !category ||
//       !Array.isArray(instructions) || !instructions.length
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "All fields are mandatory",
//       });
//     }

//     if (!status) {
//       status = "Draft";
//     }

//     // Validate user and category
//     const instructorDetails = await User.findOne({ _id: userId, accountType: "Instructor" });
//     if (!instructorDetails) {
//       return res.status(404).json({
//         success: false,
//         message: "Instructor details not found",
//       });
//     }

//     const categoryDetails = await Category.findById(category);
//     if (!categoryDetails) {
//       return res.status(404).json({
//         success: false,
//         message: "Category details not found",
//       });
//     }

//     // Upload thumbnail
//     const thumbnailImage = await uploadImageToCloudinary(thumbnail, process.env.FOLDER_NAME);
//     if (!thumbnailImage) {
//       return res.status(500).json({
//         success: false,
//         message: "Failed to upload thumbnail image",
//       });
//     }

//     // Create new course
//     const newCourse = await Course.create({
//       courseName,
//       courseDescription,
//       instructor: instructorDetails._id,
//       whatYouWillLearn,
//       price,
//       tag,
//       category: categoryDetails._id,
//       thumbnail: thumbnailImage.secure_url,
//       status,
//       instructions,
//     });

//     // Update instructor and category with the new course
//     await User.findByIdAndUpdate(
//       instructorDetails._id,
//       { $push: { courses: newCourse._id } },
//       { new: true }
//     );

//     await Category.findByIdAndUpdate(
//       categoryDetails._id,
//       { $push: { courses: newCourse._id } },
//       { new: true }
//     );

//     // Respond with success
//     res.status(200).json({
//       success: true,
//       data: newCourse,
//       message: "Course created successfully",
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to create course",
//       error: error.message,
//     });
//   }
// };


  exports.getAllCourses = async (req, res) => {
    try {
      const allCourses = await Course.find({})
        
  
      return res.status(200).json({
        success: true,
        data: allCourses,
      })
    } catch (error) {
      console.log(error)
      return res.status(404).json({
        success: false,
        message: `Can't Fetch Course Data`,
        error: error.message,
      })
    }
  }

  exports.getCourseDetails = async (req, res) => {
    try {
      const { courseId } = req.body
      const courseDetails = await Course.findOne({
        _id: courseId,
      })
        .populate({
          path: "instructor",
          populate: {
            path: "additionalDetails",
          },
        })
        .populate("category")
        .populate("ratingAndReviews")
        .populate({
          path: "courseContent",
          populate: {
            path: "subSection",
            select: "-videoUrl",
          },
        })
        .exec()
  
      if (!courseDetails) {
        return res.status(400).json({
          success: false,
          message: `Could not find course with id: ${courseId}`,
        })
      }
  
      // if (courseDetails.status === "Draft") {
      //   return res.status(403).json({
      //     success: false,
      //     message: `Accessing a draft course is forbidden`,
      //   });
      // }
  
      let totalDurationInSeconds = 0
      courseDetails.courseContent.forEach((content) => {
        content.subSection.forEach((subSection) => {
          const timeDurationInSeconds = parseInt(subSection.timeDuration)
          totalDurationInSeconds += timeDurationInSeconds
        })
      })
  
      const totalDuration = convertSecondsToDuration(totalDurationInSeconds)
  
      return res.status(200).json({
        success: true,
        data: {
          courseDetails,
          totalDuration,
        },
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      })
    }
  }