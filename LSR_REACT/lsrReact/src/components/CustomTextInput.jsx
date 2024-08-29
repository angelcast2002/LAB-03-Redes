import PropTypes from "prop-types";

function CustomTextInput({ label, name, placeholder, value, onChange }) {
    return (
        <div className="flex flex-col p-3 space-y-1 w-full">
            {label && (
                <label className="text-left" htmlFor={name}>
                    {label}
                </label>
            )}
            <input
                className="border border-gray-300 rounded-md p-2"
                type={name === "password" ? "password" : "text"}
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
            />
        </div>
    );
}

CustomTextInput.propTypes = {
    label: PropTypes.string,
    name: PropTypes.string.isRequired,
    placeholder: PropTypes.string,
    value: PropTypes.string.isRequired, // Añadir el tipo para value
    onChange: PropTypes.func.isRequired, // Añadir el tipo para onChange
};

export default CustomTextInput;
