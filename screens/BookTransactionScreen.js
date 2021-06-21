import React from 'react';
import { Text, View, TouchableOpacity, StyleSheet,TextInput, Image, Alert, KeyboardAvoidingView, ToastAndroid} from 'react-native';
import * as Permissions from 'expo-permissions';
import { BarCodeScanner } from 'expo-barcode-scanner';
import firebase from 'firebase';
import db from '../config';

export default class TransactionScreen extends React.Component {
    constructor(){
      super();
      this.state = {
        hasCameraPermissions: null,
        scanned: false,
        buttonState: 'normal',
        scanBookID: '',
        scanStudentID: '',
        transactionMessage:'',
      }
    }

    getCameraPermissions = async (id) =>{
      const {status} = await Permissions.askAsync(Permissions.CAMERA);
      
      this.setState({
        hasCameraPermissions: status === "granted",
        buttonState: id,
        scanned: false,
      });
    }

    handleBarCodeScanned = async({data})=>{
      const {buttonState}=this.state;
      if(buttonState==="BookId"){
        this.setState({
          scanned: true,
          scanBookID: data,
          buttonState: 'normal'
        });
      }
      else
      if(buttonState==="StudentId"){
        this.setState({
          scanned: true,
          scanStudentID: data,
          buttonState: 'normal'
        });
      }
      
    }

    handleTransaction=async()=>{
      var transactionMessage;
      db.collection("books").doc(this.state.scanBookID).get()
      .then((doc)=>{
        var book=doc.data()
        if(book.bookAvail){
          this.initiateBookIssue()
          transactionMessage="Book Issue"
        }
        else{
          this.initiateBookReturn();
          transactionMessage="Book Return";
        }
        ToastAndroid.show(transactionMessage, ToastAndroid.SHORT)
      })
      this.setState({
        transactionMessage:transactionMessage,
      })
    }

    initiateBookIssue=async()=>{
      db.collection("transactions").add({
        'studentID':this.state.scanStudentID,
        'bookID':this.state.scanBookID,
        'transcationType':'Issue',
        'date':firebase.firestore.Timestamp.now().toDate(),
      })

      db.collection("books").doc(this.state.scanBookID).update({
        bookAvail:false,
      })
      
      db.collection("books").doc(this.scanStudentID).update({
          'booksIssued':firebase.firestore.FieldValue.increment(1)
      })
      Alert.alert("Book ISsued!");

      this.setState({
        scanStudentID:'',
        scanBookID:'',
      })
      
        
    }
    initiateBookReturn=async()=>{
      db.collection("transactions").add({
        'studentID':this.state.scanStudentID,
        'bookID':this.state.scanBookID,
        'transactionType':'Return'
      })
      db.collection("books").doc(this.this.state.scanBookID).update({
        bookAvail:true,
      })
      db.collection("students").doc(this.scanStudentID).update({
        'booksIssued':firebase.firestore.FieldValue.increment(-1)
    })
    Alert.alert("Book Returned!");

    this.setState({
      scanBookID:'',
      scanBookID:'',
    })
  }

    render() {
      const hasCameraPermissions = this.state.hasCameraPermissions;
      const scanned = this.state.scanned;
      const buttonState = this.state.buttonState;

      if (buttonState !== "normal" && hasCameraPermissions){
        return(
          <BarCodeScanner
            onBarCodeScanned={scanned ? undefined : this.handleBarCodeScanned}
            style={StyleSheet.absoluteFillObject}
          />
        );
      }

      else if (buttonState === "normal"){
        return(
          <KeyboardAvoidingView style={styles.container} behavior="padding" enabled>
              <View>
                   <Image source={require("../assets/booklogo.jpg")} style={{width:200, height: 200}}/>
                   <Text> Willy </Text>
              </View>
              <View style={styles.inputView}>
                  <TextInput style={styles.inputBox} placeholder="BookID" value= {this.state.scanBookID} onChangeText={text=>this.setState({scanBookID: text})}/>
                  <TouchableOpacity
                      onPress={this.getCameraPermissions("BookId")}
                      style={styles.scanButton}>
                        <Text style={styles.buttonText}>Scan</Text>
                 </TouchableOpacity>
              </View>
              <View style={styles.inputView}>
                <TextInput style={styles.inputBox} placeholder="StudentID" value= {this.state.scanStudentID} onChangeText={text=>this.setState({scanStudentID: text})}/>            
                <TouchableOpacity
                    onPress={this.getCameraPermissions("StudentID")}
                    style={styles.scanButton}>
                    <Text style={styles.buttonText}>Scan</Text>
                </TouchableOpacity>
          
                <TouchableOpacity style={styles.submitButton} 
                                  onPress={async()=>{
                                            var transactionMessage=this.handleTransaction();
                                            this.setState=({
                                              scanBookID:'',
                                              scanStudentID:''
                                            })}}>
                  <Text style={styles.submitText}>Submit</Text>
               </TouchableOpacity>
              </View>
              </KeyboardAvoidingView>
        );
      }
    }
  }

  const styles = StyleSheet.create({
    submitButton:{
      backgroundColor:"#34fe78",
      width:100,
      height:50,
    },
    submitText:{
      padding: 10,
      textAlign: 'center',
      fontSize: 20,
      fontWeight: 'bold',
      color: 'white'
    },
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center'
    },
    displayText:{
      fontSize: 15,
      textDecorationLine: 'underline'
    },
    scanButton:{
      backgroundColor: '#2196F3',
      padding: 10,
      margin: 10
    },
    buttonText:{
      fontSize: 20,
    }
  }); 
